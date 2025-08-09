#!/usr/bin/env node

// Quick test script for enhanced CP2025 APIs
const http = require('http');

const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CP2025-API-Test/1.0'
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Enhanced CP2025 APIs\n');

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/api/health',
      method: 'GET'
    },
    {
      name: 'Server Info',
      endpoint: '/',
      method: 'GET'
    },
    {
      name: 'Student Competence Progress',
      endpoint: '/api/students/1/competence-progress?limit=5',
      method: 'GET'
    },
    {
      name: 'Student Achievements',
      endpoint: '/api/students/1/achievements?limit=10',
      method: 'GET'
    },
    {
      name: 'Competence Prerequisites',
      endpoint: '/api/competences/CP.FR.L1.1/prerequisites',
      method: 'GET'
    },
    {
      name: 'Daily Progress Analytics',
      endpoint: '/api/analytics/daily-progress?limit=7',
      method: 'GET'
    },
    {
      name: 'Learning Sessions Analytics',
      endpoint: '/api/analytics/learning-sessions?limit=5',
      method: 'GET'
    },
    {
      name: 'Record Student Progress',
      endpoint: '/api/students/1/record-progress',
      method: 'POST',
      data: {
        competenceCode: 'CP.FR.L1.1',
        exerciseResult: {
          score: 85,
          timeSpent: 120,
          completed: true,
          attempts: 1,
          exerciseId: 1
        }
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📝 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.endpoint}`);
      
      const result = await testAPI(test.endpoint, test.method, test.data);
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`   ✅ SUCCESS (${result.status})`);
        if (result.data && result.data.success !== undefined) {
          console.log(`   📊 API Success: ${result.data.success}`);
          if (result.data.data) {
            if (Array.isArray(result.data.data)) {
              console.log(`   📈 Data Count: ${result.data.data.length}`);
            } else if (typeof result.data.data === 'object') {
              console.log(`   📈 Data Keys: ${Object.keys(result.data.data).join(', ')}`);
            }
          }
        }
      } else if (result.status === 404) {
        console.log(`   ⚠️  NOT FOUND (${result.status}) - Expected for some endpoints without data`);
      } else if (result.status >= 500) {
        console.log(`   ❌ SERVER ERROR (${result.status})`);
        if (result.data && result.data.error) {
          console.log(`   🐛 Error: ${result.data.error.message || result.data.error.code}`);
        }
      } else {
        console.log(`   ⚠️  UNEXPECTED STATUS (${result.status})`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ CONNECTION REFUSED - Server not running?`);
      } else {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🏁 API Testing Complete\n');
  console.log('💡 Tips:');
  console.log('   - Make sure the server is running: npm run dev');
  console.log('   - Check the database is connected');
  console.log('   - Some endpoints may return empty data if database is not populated');
}

// Run the tests
runTests().catch(console.error);