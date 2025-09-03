import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import NotionConnectionManager from './components/NotionConnectionManager';
import NotionAuthCallback from './pages/NotionAuthCallback';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="flex justify-center text-4xl font-bold text-gray-900">Notion Integration</h1>
          <p className="flex justify-center text-lg text-gray-600">Connect and manage your Notion workspaces</p>
        </header>
        
        <main className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Routes>
              <Route path="/" element={<Navigate to="/notion/connections" replace />} />
              <Route path="/notion/connections" element={<NotionConnectionManager />} />
              <Route path="/notion/callback" element={<NotionAuthCallback />} />
              <Route path="/notion/connected" element={<NotionAuthCallback />} />
              <Route path="/notion/error" element={<NotionAuthCallback />} />
            </Routes>
          </div>
        </main>
        
        <footer className="text-center pt-8">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Notion Integration</p>
        </footer>
      </div>
    </div>
  );
}

export default App;