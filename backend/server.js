import "dotenv/config";
import express from "express";
import cors from "cors";
import { Client as NotionClient } from "@notionhq/client";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { pool, testConnection, initDatabase } from "./src/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS error: Origin not allowed', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS with the configured options
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await testConnection();
    await initDatabase();
    console.log("Database connection established");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
};

initializeDatabase();

// Routes
app.get("/connections", async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await pool.query(
      "SELECT * FROM notion_connections WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// Get Notion OAuth URL
app.get("/auth/url", (req, res) => {
  try {
    console.log('Received auth URL request with query params:', req.query);
    
    // Create a new URL object with the base authorization URL
    const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
    
    // Ensure the redirect URI is properly encoded
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    console.log('Using redirect URI:', redirectUri);
    
    // Add required parameters
    authUrl.searchParams.append("client_id", process.env.NOTION_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    
    // Add state parameter with user ID
    const state = Buffer.from(
      JSON.stringify({
        userId: req.query.userId || "anonymous",
        frontendUrl: req.query.frontendUrl || "",
        timestamp: Date.now(),
      })
    ).toString("base64");
    
    authUrl.searchParams.append("state", state);
    
    console.log('Generated auth URL:', authUrl.toString());
    
    res.json({ 
      success: true,
      authUrl: authUrl.toString() 
    });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate authentication URL",
      details: error.message 
    });
  }
});

// Handle OAuth callback (support both /callback and /notion/callback for backward compatibility)
app.get(["/callback", "/notion/callback"], async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/notion/error?message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/notion/error?message=${encodeURIComponent('No authorization code received')}`);
  }

  try {
    // Exchange code for access token
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Token exchange error:', data);
      throw new Error(
        data.error_description || "Failed to exchange code for token"
      );
    }

    // Save the connection to database
    const { access_token, workspace_id } = data;
    let stateData = {};
    
    try {
      stateData = state ? JSON.parse(Buffer.from(state, "base64").toString()) : {};
    } catch (e) {
      console.warn('Failed to parse state:', e);
    }
    
    const frontendUrl = stateData.frontendUrl || process.env.FRONTEND_URL;
    const userId = stateData.userId || "anonymous";

    // Get workspace name from Notion API
    const notion = new NotionClient({ auth: access_token });
    let workspace_name = 'My Notion Workspace';
    
    try {
      const user = await notion.users.me({});
      workspace_name = user.bot.workspace_name || workspace_name;
    } catch (e) {
      console.warn('Failed to fetch workspace name:', e);
    }

    await pool.query(
      `INSERT INTO notion_connections 
       (user_id, workspace_id, workspace_name, access_token, refresh_token, bot_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id, workspace_id) 
       DO UPDATE SET 
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         workspace_name = EXCLUDED.workspace_name,
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        workspace_id,
        workspace_name,
        access_token,
        data.refresh_token || "",
        data.bot_id || ""
      ]
    );

    // Redirect back to the frontend with success status
    res.redirect(`${frontendUrl}/notion/connected?success=true`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/notion/error?message=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

// Delete a Notion connection
app.delete("/connections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM notion_connections WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    res.status(500).json({ error: "Failed to delete connection" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
