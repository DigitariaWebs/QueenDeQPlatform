import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✔️  MongoDB connected');
    console.log(`📍 Host: ${connection.connection.host}`);
    console.log(`🗄️  Database: ${connection.connection.name}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    return connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Continuing without database connection...');
    return null;
  }
};

// Function to create additional indexes for optimal performance
const createIndexes = async () => {
  try {
    // Check if we have a valid database connection
    if (!mongoose.connection.db) {
      console.log('⚠️  No database connection - skipping index creation');
      return;
    }
    
    const db = mongoose.connection.db;
    
    // User collection indexes
    await db.collection('users').createIndex(
      { email: 1 }, 
      { unique: true, name: 'email_unique' }
    );
    
    await db.collection('users').createIndex(
      { stripeCustomerId: 1 }, 
      { sparse: true, name: 'stripe_customer_id' }
    );
    
    await db.collection('users').createIndex(
      { role: 1, isActive: 1 }, 
      { name: 'role_active' }
    );
    
    // ChatSession collection indexes
    await db.collection('chatsessions').createIndex(
      { userId: 1, status: 1, lastMessageAt: -1 }, 
      { name: 'user_status_lastmessage' }
    );
    
    await db.collection('chatsessions').createIndex(
      { shareToken: 1 }, 
      { sparse: true, unique: true, name: 'share_token_unique' }
    );
    
    // Message collection indexes
    await db.collection('messages').createIndex(
      { sessionId: 1, order: 1 }, 
      { name: 'session_order' }
    );
    
    await db.collection('messages').createIndex(
      { userId: 1, createdAt: -1 }, 
      { name: 'user_created_desc' }
    );
    
    // SubscriptionStatusChange collection indexes
    await db.collection('subscriptionstatuschanges').createIndex(
      { userId: 1, createdAt: -1 }, 
      { name: 'user_created_desc' }
    );
    
    await db.collection('subscriptionstatuschanges').createIndex(
      { stripeEventId: 1 }, 
      { sparse: true, unique: true, name: 'stripe_event_unique' }
    );
    
    console.log('✔️  Database indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Some indexes may already exist:', error.message);
  }
};

// Event listeners for connection
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// Handle app termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

export default connectDB;
