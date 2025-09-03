import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function NotionAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const message = searchParams.get('message');

    if (success) {
      // Show success message and redirect after a short delay
      setTimeout(() => {
        navigate('/notion/connections');
      }, 2000);
    } else if (message) {
      // Show error message
      console.error('OAuth error:', message);
    } else {
      navigate('/notion/connections');
    }
  }, [navigate, searchParams]);

  const success = searchParams.get('success') === 'true';
  const message = searchParams.get('message');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        {success ? (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
            <p className="text-gray-700">Successfully connected to Notion. Redirecting...</p>
          </>
        ) : message ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700">{decodeURIComponent(message)}</p>
            <button
              onClick={() => navigate('/notion/connections')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </>
        ) : (
          <p className="text-gray-700">Loading...</p>
        )}
      </div>
    </div>
  );
}
