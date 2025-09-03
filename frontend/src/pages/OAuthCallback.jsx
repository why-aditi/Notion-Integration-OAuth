import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { notionApi } from '../utils/api';
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        const errorMsg = 'No authorization code received from Notion.';
        console.error(errorMsg);
        setError(errorMsg);
        setStatus('error');
        window.opener.postMessage(
          { type: 'notion-oauth-error', error: errorMsg },
          window.location.origin
        );
        return;
      }

      try {
        setStatus('loading');
        
        // Send the code to our backend to exchange for tokens
        const response = await notionApi.exchangeCode(code, state);
        
        // Notify the parent window that authentication was successful
        window.opener.postMessage(
          { 
            type: 'notion-oauth-success',
            data: response.data
          },
          window.location.origin
        );
        
        setStatus('success');
        
        // Close the window after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
        
      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        const errorMsg = error.response?.data?.error || 'Failed to authenticate with Notion. Please try again.';
        setError(errorMsg);
        setStatus('error');
        
        window.opener.postMessage(
          { 
            type: 'notion-oauth-error', 
            error: errorMsg
          },
          window.location.origin
        );
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="oauth-callback">
      <div className="status-container">
        {status === 'loading' && (
          <>
            <FaSpinner className="spinner" />
            <h2>Completing Notion connection...</h2>
            <p>Please wait while we connect your Notion workspace.</p>
          </>
        )}
        {status === 'error' && (
          <div className="error-state">
            <FaExclamationCircle className="error-icon" />
            <h2>Connection Failed</h2>
            <p>{error || 'An error occurred while connecting to Notion.'}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.close()}
            >
              Close Window
            </button>
          </div>
        )}
        {status === 'success' && (
          <div className="success-state">
            <FaCheckCircle className="success-icon" />
            <h2>Connected Successfully</h2>
            <p>Your Notion workspace has been connected successfully.</p>
            <p>You can close this window and return to the application.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.close()}
              autoFocus
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
