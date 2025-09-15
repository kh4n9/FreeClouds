const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Login Flow...\n');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials - you should create a test user first
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testLogin() {
  try {
    console.log('📧 Testing with credentials:');
    console.log('Email:', TEST_EMAIL);
    console.log('Password:', TEST_PASSWORD);
    console.log('Base URL:', BASE_URL);
    console.log('');

    // Step 1: Test login API
    console.log('🔄 Step 1: Testing login API...');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('User data:', userData);

      // Extract cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('Set-Cookie header:', setCookieHeader);

      if (setCookieHeader) {
        // Step 2: Test /api/auth/me with cookie
        console.log('\n🔄 Step 2: Testing /api/auth/me with cookie...');

        const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': setCookieHeader.split(';')[0], // Get just the token part
            'Origin': BASE_URL,
          },
        });

        console.log('Me response status:', meResponse.status);

        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('✅ Auth check successful!');
          console.log('Me data:', meData);

          console.log('\n🎯 Test Results:');
          console.log('✅ Login API: Working');
          console.log('✅ Cookie setting: Working');
          console.log('✅ Auth verification: Working');
          console.log('\n💡 The login flow is working correctly!');
          console.log('   If you\'re still having issues, check:');
          console.log('   1. Browser developer tools for cookie storage');
          console.log('   2. Network tab for redirect issues');
          console.log('   3. Console for JavaScript errors');

        } else {
          const meError = await meResponse.text();
          console.log('❌ Auth check failed:', meError);
        }
      } else {
        console.log('❌ No cookie set in response');
      }

    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Login failed:', errorData);

      if (loginResponse.status === 401) {
        console.log('\n💡 This means:');
        console.log('   - User doesn\'t exist, or');
        console.log('   - Password is incorrect');
        console.log('   Please create a test user with these credentials first.');
        console.log('\n🔧 To create a test user, run:');
        console.log('   npm run create-admin');
        console.log('   Or register through the web interface.');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('   1. Server is not running (npm run dev)');
    console.log('   2. Database connection issues');
    console.log('   3. Environment variables not set');
    console.log('   4. Network connectivity issues');
  }
}

// Helper function to create a test user
async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({
        name: 'Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (registerResponse.ok) {
      console.log('✅ Test user created successfully!');
      return true;
    } else {
      const error = await registerResponse.text();
      console.log('❌ Failed to create test user:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting login tests...\n');

  // Try login first
  await testLogin();

  console.log('\n' + '='.repeat(50));
  console.log('🧪 Test completed!');
  console.log('='.repeat(50));
}

// Run the tests
runTests();
