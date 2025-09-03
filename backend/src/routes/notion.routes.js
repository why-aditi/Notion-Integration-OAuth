import express from 'express';
import { 
  getAuthUrl, 
  handleCallback, 
  getConnections, 
  deleteConnection 
} from '../controllers/notion.controller.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Log all requests for debugging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    body: req.body
  });
  next();
});

// Get Notion OAuth URL
router.get('/auth', 
  validateRequest({
    query: {
      frontendUrl: { type: 'string', optional: true, format: 'uri' }
    }
  }),
  getAuthUrl
);

// OAuth callback URL
router.get('/callback', handleCallback);

// Get user's Notion connections
router.get('/connections', getConnections);

// Delete a connection
router.delete('/connections/:id', 
  validateRequest({
    params: {
      id: { type: 'string', minLength: 1 }
    }
  }),
  deleteConnection
);

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default router;
