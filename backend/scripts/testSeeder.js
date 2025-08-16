//When you want to quickly test if models work

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/index.js';

const testSeeder = async () => {
  try {
    console.log('🌱 Testing simple user creation...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('🧹 Cleared existing users');
    
    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'Tiare',
      authProvider: 'local'
    });
    
    await testUser.save();
    console.log('✅ Created test user:', testUser.email);
    
    // Query the user
    const foundUser = await User.findByEmail('test@example.com');
    console.log('✅ Found user:', foundUser.name, foundUser.isPremium);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

testSeeder();
