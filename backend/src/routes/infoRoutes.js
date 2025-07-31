import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Queen de Q Chat Backend is running! 👑',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['OpenAI Chat', 'Streaming', 'Multiple Personas']
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: '👑 Queen de Q Chat API',
    endpoints: {
      health: '/api/health',
      chat: '/api/ai/chat',
      stream: '/api/ai/chat/stream',
      modes: '/api/ai/modes'
    }
  });
});

export default router; 