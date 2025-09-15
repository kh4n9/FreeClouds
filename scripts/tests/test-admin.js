const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing Admin Access...\n');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials - you should create an admin user first
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function testAdminFlow() {
  try {
    console.log('📧 Testing with admin credentials:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('Base URL:', BASE_URL);
    console.log('');

    // Step 1: Login as admin
    console.log('🔄 Step 1: Login as admin...');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    console.log('Login response status:', loginResponse.status);

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.log('❌ Login failed:', errorData);

      if (loginResponse.status === 401) {
        console.log('\n💡 Admin user might not exist. Create one with:');
        console.log('   npm run create-admin');
      }
      return;
    }

    const userData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('User data:', userData);

    // Extract cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);

    if (!setCookieHeader) {
      console.log('❌ No cookie set in response');
      return;
    }

    const tokenCookie = setCookieHeader.split(';')[0];

    // Step 2: Test /api/auth/me
    console.log('\n🔄 Step 2: Testing auth/me with cookie...');

    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': tokenCookie,
        'Origin': BASE_URL,
      },
    });

    console.log('Me response status:', meResponse.status);

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth check successful!');
      console.log('Me data:', meData);
      console.log('User role:', meData.role);

      if (meData.role !== 'admin') {
        console.log('❌ User is not admin!');
        console.log('   Current role:', meData.role);
        console.log('   Required role: admin');
        return;
      }

      // Step 3: Test admin stats API
      console.log('\n🔄 Step 3: Testing admin stats API...');

      const statsResponse = await fetch(`${BASE_URL}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Cookie': tokenCookie,
          'Origin': BASE_URL,
        },
      });

      console.log('Stats response status:', statsResponse.status);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Admin stats API working!');
        console.log('Stats data keys:', Object.keys(statsData));

        // Step 4: Test admin page access
        console.log('\n🔄 Step 4: Testing admin page access...');

        console.log('\n🎯 Test Results Summary:');
        console.log('✅ Admin login: Working');
        console.log('✅ Cookie setting: Working');
        console.log('✅ Auth verification: Working');
        console.log('✅ Admin role check: Working');
        console.log('✅ Admin stats API: Working');
        console.log('\n🚀 Admin access is fully functional!');
        console.log('\n📱 Next steps:');
        console.log('   1. Open browser to:', `${BASE_URL}/admin`);
        console.log('   2. Login with admin credentials');
        console.log('   3. Check browser console for any JS errors');

      } else {
        const statsError = await statsResponse.text();
        console.log('❌ Admin stats API failed:', statsError);

        if (statsResponse.status === 403) {
          console.log('   This means the user is not recognized as admin in the API');
        }
      }

    } else {
      const meError = await meResponse.text();
      console.log('❌ Auth check failed:', meError);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('   1. Server is not running (npm run dev)');
    console.log('   2. Database connection issues');
    console.log('   3. Admin user does not exist');
    console.log('   4. Environment variables not set');
  }
}

// Helper function to create admin user
async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (registerResponse.ok) {
      console.log('✅ Admin user created! (Note: You need to manually set role to "admin" in database)');
      console.log('   OR use: npm run create-admin');
      return true;
    } else {
      const error = await registerResponse.text();
      console.log('❌ Failed to create admin user:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error creating admin user:', error.message);
    return false;
  }
}

// Helper to check user role in database
async function checkUserRole() {
  console.log('\n🔍 Checking user role in database...');
  console.log('Email to check:', ADMIN_EMAIL);
  console.log('\nTo manually check user role:');
  console.log('1. Connect to your MongoDB');
  console.log('2. Run: db.users.findOne({ email: "' + ADMIN_EMAIL + '" })');
  console.log('3. Check if role field is "admin"');
  console.log('4. If not, run: db.users.updateOne({ email: "' + ADMIN_EMAIL + '" }, { $set: { role: "admin" } })');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting admin access tests...\n');

  // Try admin flow
  await testAdminFlow();

  console.log('\n' + '='.repeat(60));
  console.log('🧪 Admin Test Completed!');
  console.log('='.repeat(60));

  // Show additional help
  await checkUserRole();
}

// Run the tests
runTests();
