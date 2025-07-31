import chatRoutes from '../routes/chatRoutes.js';
import infoRoutes from '../routes/infoRoutes.js';

export const setupRoutes = (app) => {
  // API routes
  app.use('/api/ai', chatRoutes);
  app.use('/api', infoRoutes);
  
  // Root route
  app.use('/', infoRoutes);
}; 