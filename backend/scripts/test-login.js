import 'dotenv/config';
import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('🔍 Testing login endpoint...');
    
    const baseUrl = 'http://localhost:5001';
    const loginData = {
      email: "mohamed@gmail.com",
      password: "mohamed123"
    };

    console.log('📤 Sending login request with data:', loginData);
    
    const response = await axios.post(`${baseUrl}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testLogin();
