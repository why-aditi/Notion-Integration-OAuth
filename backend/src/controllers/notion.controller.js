import { 
  getAuthUrl as getNotionAuthUrl, 
  exchangeCodeForToken, 
  saveConnection, 
  getUserConnections as getDbConnections, 
  deleteConnection as deleteDbConnection 
} from '../services/notion.service.js';
import config from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';

export const getAuthUrl = (req, res) => {
  try {
    // In a real app, get this from the authenticated user's session
    const state = Buffer.from(JSON.stringify({
      userId: config.defaults.userId,
      frontendUrl: req.query.frontendUrl || config.frontend.url
    })).toString('base64');

    const authUrl = getNotionAuthUrl(state);
    res.json({ 
      authUrl,
      clientId: config.notion.clientId,
      redirectUri: config.notion.redirectUri
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication URL',
      details: error.message 
    });
  }
};

export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log('OAuth callback received with code and state:', { code: !!code, state: !!state });
    
    if (!code) {
      console.error('No authorization code provided in callback');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    let stateData = {};
    try {
      stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : {};
    } catch (e) {
      console.error('Error parsing state:', e);
    }
    
    const userId = stateData.userId || config.defaults.userId;
    const frontendUrl = stateData.frontendUrl || req.headers.origin || config.frontend.url;
    console.log('Processing callback for user:', { userId, frontendUrl });
    
    try {
      // Exchange code for tokens
      console.log('Exchanging code for tokens...');
      const tokenData = await exchangeCodeForToken(code);
      console.log('Token exchange successful, saving connection...');
      
      // Save the connection
      const connectionData = {
        ...tokenData,
        workspace_id: tokenData.workspace_id || 'unknown',
        workspace_name: tokenData.workspace_name || 'Notion Workspace',
        bot_id: tokenData.bot_id || null,
        user_id: userId
      };
      
      await saveConnection(userId, connectionData);
      console.log('Connection saved successfully');

      // Redirect back to the frontend with success message
      const redirectUrl = new URL(`${frontendUrl}/connections`);
      redirectUrl.searchParams.set('success', 'true');
      console.log('Redirecting to:', redirectUrl.toString());
      
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      const errorMessage = error.message || 'Failed to complete OAuth flow';
      const redirectUrl = new URL(`${frontendUrl}/connections`);
      redirectUrl.searchParams.set('error', errorMessage);
      return res.redirect(redirectUrl.toString());
    }
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    const frontendUrl = config.frontend.url;
    const redirectUrl = new URL(`${frontendUrl}/connections`);
    redirectUrl.searchParams.set('error', 'An unexpected error occurred');
    return res.redirect(redirectUrl.toString());
  }
};

export const getConnections = async (req, res) => {
  // In a real app, get this from the authenticated user's session
  const userId = req.user?.id || 'demo-user';
  console.log(`Fetching connections for user: ${userId}`);
  
  try {
    const connections = await getUserConnections(userId);
    console.log(`Found ${connections.rowCount} connections for user: ${userId}`);
    res.json(connections.rows);
  } catch (error) {
    console.error('Error getting connections:', {
      error: error.message,
      stack: error.stack,
      userId
    });
    res.status(500).json({ 
      error: 'Failed to fetch connections',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const { id } = req.params;
    // In a real app, get this from the authenticated user's session
    const userId = req.user?.id || 'demo-user';
    
    const connection = await deleteConnection(userId, id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
};
