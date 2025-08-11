import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function getTestUserId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find();

    if (users.length > 0) {
      users.forEach(async user => {
        console.log('📋 Found user:');
        console.log('   ID:', user._id.toString());
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   IsActive:', user.isActive || 'undefined');
      
      // If user is not active, let's activate them
      if (!user.isActive) {
        user.isActive = true;
        await user.save();
        console.log('✅ User activated');
      }
      
      console.log('\n🔑 Use this ID in your test scripts:');
      console.log(`'x-user-id': '${user._id.toString()}'`);
    });
  } else {
    console.log('❌ No users found in database');
  }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

getTestUserId();
