import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { notionApi } from '../utils/api';
import { FaSpinner, FaExternalLinkAlt, FaTrashAlt } from 'react-icons/fa';

export default function NotionConnectionManager() {
  const [connections, setConnections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  
  // Get user ID from localStorage or use a default value
  const [userId] = useState(() => {
    // Try to get user ID from localStorage, or generate a new one if it doesn't exist
    let id = localStorage.getItem('notionUserId');
    if (!id) {
      id = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('notionUserId', id);
    }
    return id;
  });

  const fetchConnections = useCallback(async () => {
    try {
      const response = await notionApi.getConnections(userId);
      setConnections(response.data || []);
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch Notion connections';
      setError(errorMessage);
      console.error('Error fetching connections:', err);
    }
  }, [userId]);

  useEffect(() => {
    // Check for success/error in URL params
    const success = searchParams.get('success');
    const message = searchParams.get('message');
    
    if (success === 'true') {
      // Refresh connections on success
      fetchConnections();
    } else if (message) {
      setError(decodeURIComponent(message));
    }
    
    fetchConnections();
  }, [searchParams, fetchConnections]);

  const handleConnectNotion = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      console.log('Requesting OAuth URL...');
      // Get the OAuth URL from the backend
      const response = await notionApi.getAuthUrl(
        userId,
        window.location.origin
      );
      
      console.log('Auth URL response:', response);
      
      if (!response.data?.authUrl) {
        console.error('No authUrl in response:', response);
        throw new Error('Failed to get authentication URL');
      }
      
      // Navigate directly to the authorization URL
      window.location.href = response.data.authUrl;
      
    } catch (err) {
      setError('Failed to start Notion connection');
      console.error('Error connecting to Notion:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (window.confirm('Are you sure you want to disconnect this Notion account? This will revoke access to your Notion data.')) {
      try {
        await notionApi.deleteConnection(userId, connectionId);
        setError('');
        fetchConnections();
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to disconnect Notion account';
        setError(errorMessage);
        console.error('Error disconnecting Notion:', err);
      }
    }
  };

  return (
    <div className="notion-connection-manager">
      <h2>Notion Connections</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {searchParams.get('success') === 'true' && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Successfully connected to Notion!
        </div>
      )}
      
      
      <button 
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Notion Account'}
      </button>
      
      {connections.length > 0 ? (
        <div className="connections-list">
          <h3>Connected Accounts</h3>
          {connections.length === 0 ? (
            <div className="empty-state">
              <p>No Notion workspaces connected yet.</p>
            </div>
          ) : (
            <ul>
              {connections.map(conn => (
                <li key={conn.id} className="connection-item">
                  <div className="connection-info">
                    <span className="connection-org">
                      {conn.workspace_name || 'Notion Workspace'}
                      {conn.workspace_icon && (
                        <span className="workspace-icon" dangerouslySetInnerHTML={{ __html: conn.workspace_icon }}></span>
                      )}
                    </span>
                    <span className="connection-details">
                      <span className="connection-id">Workspace ID: {conn.workspace_id}</span>
                      <a 
                        href={conn.workspace_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="connection-link"
                      >
                        Open in Notion <FaExternalLinkAlt className="external-icon" />
                      </a>
                    </span>
                  </div>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDisconnect(conn.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <FaSpinner className="spinner" /> Disconnecting...
                      </>
                    ) : (
                      <>
                        <FaTrashAlt /> Disconnect
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p>No Notion accounts connected yet.</p>
      )}
      
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Connect Notion Account</h3>
            <p>Click the button below to connect your Notion account.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handleConnectNotion}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <FaSpinner className="spinner" /> Connecting...
                  </>
                ) : (
                  'Connect with Notion'
                )}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isConnecting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
