import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

export const setupMiddleware = (app) => {
  // Trust proxy for proper IP detection (important for Vercel deployments)
  app.set('trust proxy', 1);
  
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  // Accept all origins for development and production
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.includes('localhost')) return callback(null, true);
      
      // Allow Vercel domains
      if (origin.includes('vercel.app')) return callback(null, true);
      
      // Allow all origins in development
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      
      // In production, you might want to restrict to specific domains
      // For now, allow all
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-user-id'],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  };
  
  app.use(cors(corsOptions));
  
  // Additional headers for CORS and API responses
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
  
  
  // Performance middleware
  app.use(compression());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
  
  // Body parsing - increased limits for chat conversations
  // Skip body parsing for Stripe webhook to preserve raw body for signature verification
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  // For file uploads, you can add multer or similar middleware here if needed
  
  // Logging
  app.use(morgan('dev'));
}; 