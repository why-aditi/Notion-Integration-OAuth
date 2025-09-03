import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'NOTION_CLIENT_ID',
  'NOTION_CLIENT_SECRET',
  'NOTION_REDIRECT_URI',
  'FRONTEND_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Application configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  
  // Notion OAuth
  notion: {
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    redirectUri: process.env.NOTION_REDIRECT_URI,
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token'
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL,
    allowedOrigins: [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ].filter(Boolean)
  },
  
  // Default values
  defaults: {
    userId: process.env.DEFAULT_USER_ID || 'demo-user',
    workspaceName: 'Notion Workspace'
  }
};

// Export as default for easier imports
export default config;
