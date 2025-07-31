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
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));
  
  // Performance middleware
  app.use(compression());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  
  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  
  // Logging
  app.use(morgan('dev'));
}; 