import { Client } from '@notionhq/client';
import { pool } from '../db/index.js';
import fetch from 'node-fetch';
import config from '../config/config.js';

/**
 * Generates the Notion OAuth authorization URL
 * @param {string} state - OAuth state parameter for CSRF protection
 * @returns {string} The complete authorization URL
 */
export const getAuthUrl = (userId, frontendUrl, state = '') => {
  try {
    const params = new URLSearchParams({
      client_id: config.notion.clientId,
      redirect_uri: config.notion.redirectUri,
      response_type: 'code',
      owner: 'user',
      state: Buffer.from(JSON.stringify({ 
        userId,
        frontendUrl: frontendUrl || config.defaults.frontendUrl
      })).toString('base64')
    });

    return `${config.notion.authUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error('Failed to generate authentication URL');
  }
};

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param {string} code - The authorization code from Notion
 * @returns {Promise<Object>} Token response from Notion
 */
export const exchangeCodeForToken = async (code) => {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  console.log('Exchanging authorization code for tokens...');
  
  try {
    const authString = Buffer.from(`${config.notion.clientId}:${config.notion.clientSecret}`).toString('base64');
    const response = await fetch(config.notion.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.notion.redirectUri
      })
    });

    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        errorDescription: responseData.error_description,
        requestId: response.headers.get('x-request-id')
      };
      
      console.error('Error from Notion API:', errorDetails);
      
      throw new Error(
        responseData.error_description || 
        responseData.error || 
        `Failed to exchange code for token (HTTP ${response.status})`
      );
    }

    console.log('Successfully exchanged code for tokens');
    return responseData;
  } catch (error) {
    console.error('Error in exchangeCodeForToken:', error);
    throw new Error(`Failed to complete OAuth flow: ${error.message}`);
  }
};

/**
 * Saves or updates a Notion connection in the database
 * @param {Object} connectionData - Connection data to save
 * @returns {Promise<Object>} The saved connection
 */
export const saveConnection = async (connectionData) => {
  if (!connectionData || !connectionData.userId || !connectionData.workspaceId || !connectionData.accessToken) {
    throw new Error('Missing required connection data');
  }

  const {
    userId,
    workspaceId,
    workspaceName = config.defaults.workspaceName,
    workspaceIcon,
    accessToken,
    tokenType = 'bearer',
    botId,
    duplicatedTemplateId
  } = connectionData;

  const query = `
    INSERT INTO notion_connections (
      user_id, workspace_id, workspace_name, workspace_icon, 
      access_token, token_type, bot_id, duplicated_template_id
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id, workspace_id) 
    DO UPDATE SET 
      workspace_name = EXCLUDED.workspace_name,
      workspace_icon = EXCLUDED.workspace_icon,
      access_token = EXCLUDED.access_token,
      token_type = EXCLUDED.token_type,
      bot_id = EXCLUDED.bot_id,
      duplicated_template_id = EXCLUDED.duplicated_template_id,
      updated_at = NOW()
    RETURNING *
  `;
  
  console.log('Saving connection to database...', {
    userId,
    workspaceId,
    workspaceName: workspaceName || 'Not provided',
    hasWorkspaceIcon: !!workspaceIcon,
    tokenType,
    hasBotId: !!botId,
    hasTemplateId: !!duplicatedTemplateId
  });

  const client = await pool.connect();
  try {
    const result = await client.query(query, [
      userId, 
      workspaceId, 
      workspaceName, 
      workspaceIcon, 
      accessToken, 
      tokenType, 
      botId, 
      duplicatedTemplateId
    ]);
    
    console.log('Successfully saved connection:', { 
      connectionId: result.rows[0]?.id,
      workspaceId: workspaceId,
      workspaceName: workspaceName
    });
    
    return result.rows[0];
  } catch (error) {
    console.error('Error saving connection to database:', {
      error: error.message,
      userId,
      workspaceId: workspace_id,
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token
    });
    throw new Error(`Failed to save connection: ${error.message}`);
  } finally {
    client.release();
  }
};

export const getUserConnections = async (userId) => {
  const result = await pool.query(
    'SELECT id, workspace_id, workspace_name, created_at FROM notion_connections WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};

export const deleteConnection = async (userId, connectionId) => {
  const result = await pool.query(
    'DELETE FROM notion_connections WHERE id = $1 AND user_id = $2 RETURNING *',
    [connectionId, userId]
  );
  return result.rows[0];
};
