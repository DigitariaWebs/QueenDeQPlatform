import 'dotenv/config';
import 'express-async-errors';

import express from 'express';
import connectDB from './config/database.js';
import { setupMiddleware } from './config/middleware.js';
import { setupRoutes } from './config/routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Initialize the application
const initializeApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Setup middleware
    setupMiddleware(app);

    // Setup routes
    setupRoutes(app);

    // Error handling
    app.use(notFound);
    app.use(errorHandler);

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
};

// Start the application
await initializeApp();

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

// Export for potential use by other files
export default app;