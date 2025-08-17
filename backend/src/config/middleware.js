import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

export const setupMiddleware = (app) => {
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  // Accept all origins (for development/testing)
  app.use(cors({
    origin: true,
    credentials: true
  }));
  
  
  // Performance middleware
  app.use(compression());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
  
  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  // For file uploads, you can add multer or similar middleware here if needed
  
  // Logging
  app.use(morgan('dev'));
}; 