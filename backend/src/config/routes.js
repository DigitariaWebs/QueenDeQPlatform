import chatRoutes from '../routes/chatRoutes.js';
import infoRoutes from '../routes/infoRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import subscriptionRoutes from '../routes/subscriptionRoutes.js';

export const setupRoutes = (app) => {
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Chat and AI routes
  app.use('/api/ai', chatRoutes);
  
  // Subscription and payment routes
  app.use('/api', subscriptionRoutes);
  
  // Info and general routes
  app.use('/api', infoRoutes);
  
  // Root route
  app.use('/', infoRoutes);
}; 