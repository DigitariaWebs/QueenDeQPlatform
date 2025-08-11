//When MongoDB connection isn't working


import 'dotenv/config';
import connectDB from '../src/config/database.js';
import mongoose from 'mongoose';

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@'));
    
    await connectDB();
    console.log('✅ Connection successful!');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

testConnection();
