import 'dotenv/config';
import 'express-async-errors';

import express from 'express';
import { setupMiddleware } from './config/middleware.js';
import { setupRoutes } from './config/routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Error handling
app.use(notFound);
app.use(errorHandler);

//–– start server (only in development)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
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
}

// Export for Vercel serverless functions
export default app;