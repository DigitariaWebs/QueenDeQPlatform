require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// ========================================
// QUEEN DE Q - CHAT-ONLY SERVER
// Deployment-ready version without database dependencies
// ========================================

// Only import chat routes - no database, no user management
const chatRoutes = require('./routes/chatRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

//–– global middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

//–– API routes (chat functionality only)
app.use('/api/ai', chatRoutes);

//–– Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Queen de Q Chat Backend is running! 👑',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['OpenAI Chat', 'Streaming', 'Multiple Personas']
  });
});

//–– Root endpoint
app.get('/', (req, res) => {
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

//–– 404 + error handler
app.use(notFound);
app.use(errorHandler);

//–– start server
const PORT = process.env.PORT || 5000;

// More robust error handling for server startup
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`👑 Queen de Q Chat Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/ai`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`💬 Ready for deployment! 🚀`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port or kill the process using that port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Server closed');
    process.exit(0);
  });
}); 