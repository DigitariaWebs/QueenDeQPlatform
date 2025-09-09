import 'dotenv/config';
import 'express-async-errors';

import express from 'express';
import connectDB from '../src/config/database.js';
import { setupMiddleware } from '../src/config/middleware.js';
import { setupRoutes } from '../src/config/routes.js';
import notFound from '../src/middleware/notFound.js';
import errorHandler from '../src/middleware/errorHandler.js';

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

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
};

// For serverless environments, we need to initialize on first request
let appPromise = null;

// Export for Vercel serverless functions
export default async (req, res) => {
  if (!appPromise) {
    appPromise = initializeApp();
  }
  
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
