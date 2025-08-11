import 'dotenv/config';
import axios from 'axios';

const testPatchProfile = async () => {
  try {
    console.log('🔍 Testing PATCH profile endpoint...');
    
    const baseUrl = 'http://localhost:5001';
    
    // First, login to get token
    console.log('\n📤 Step 1: Login to get token...');
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: "mohamed@gmail.com",
      password: "mohamed123"
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    console.log('Current user data:', JSON.stringify(loginResponse.data.user, null, 2));
    
    // Test PATCH with name update
    console.log('\n📤 Step 2: Updating name via PATCH...');
    const updateData = {
      name: "not mohamed 123"
    };
    
    console.log('Update payload:', JSON.stringify(updateData, null, 2));
    
    const patchResponse = await axios.patch(`${baseUrl}/api/auth/me`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ PATCH request successful');
    console.log('PATCH response:', JSON.stringify(patchResponse.data, null, 2));
    
    // Verify the change by getting current profile
    console.log('\n📤 Step 3: Verifying update via GET...');
    const getResponse = await axios.get(`${baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ GET request successful');
    console.log('Current profile after update:', JSON.stringify(getResponse.data, null, 2));
    
    // Check if name actually changed
    const oldName = "mohamed 123";
    const newName = "not mohamed 123";
    const actualName = getResponse.data.user.name;
    
    console.log('\n🔍 Verification:');
    console.log('Expected name:', newName);
    console.log('Actual name:', actualName);
    console.log('Name changed?', actualName === newName ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
};

testPatchProfile();
