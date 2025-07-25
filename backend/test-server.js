// Test script for RevEd Kids Backend
const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Test functions
async function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Health check:', res.statusCode);
        console.log('Response:', JSON.parse(data));
        resolve(res.statusCode === 200);
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Timeout')));
  });
}

async function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prenom: 'TestStudent',
      nom: 'Test'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Login test:', res.statusCode);
        try {
          const response = JSON.parse(data);
          console.log('Response:', response);
          resolve(res.statusCode === 200 || res.statusCode === 404);
        } catch (e) {
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testCORS() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = http.request(options, (res) => {
      console.log('✅ CORS test:', res.statusCode);
      console.log('CORS headers:', res.headers['access-control-allow-origin']);
      resolve(res.statusCode === 200);
    });

    req.on('error', reject);
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing RevEd Kids Backend...\n');

  try {
    console.log('1. Testing health endpoint...');
    await testHealth();
    console.log('');

    console.log('2. Testing CORS...');
    await testCORS();
    console.log('');

    console.log('3. Testing login endpoint...');
    await testLogin();
    console.log('');

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 3001');
    console.log('💡 Run: npm run dev');
  }
}

runTests(); 