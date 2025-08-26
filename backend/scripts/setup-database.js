#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up MySQL database for RevEd Kids...\n');

// Change to the backend directory
process.chdir(path.join(__dirname, '..'));

try {
  // Step 1: Run database migration
  console.log('📋 Step 1: Running database migration...');
  execSync('npm run migrate', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!\n');

  // Step 2: Run comprehensive seeding
  console.log('🌱 Step 2: Running comprehensive database seeding...');
  execSync('npm run db:seed:comprehensive', { stdio: 'inherit' });
  console.log('✅ Seeding completed successfully!\n');

  console.log('🎉 Database setup completed successfully!');
  console.log('\n📊 Your MySQL database now contains:');
  console.log('   - 5 test students with login credentials');
  console.log('   - 8 educational modules');
  console.log('   - 8 exercises across different subjects and levels');
  console.log('   - Student progress records');
  console.log('   - Learning paths');
  console.log('   - Sessions and audit logs');
  
  console.log('\n🔑 Test Credentials:');
  console.log('   Email: lucas.martin@test.com, Password: password123');
  console.log('   Email: emma.durand@test.com, Password: password123');
  console.log('   Email: noah.lefebvre@test.com, Password: password123');
  console.log('   Email: alice.dupont@test.com, Password: password123');
  console.log('   Email: thomas.moreau@test.com, Password: password123');
  
  console.log('\n🚀 You can now start the backend server with: npm run dev');
  console.log('🌐 The API will be available at: http://localhost:3003');
  console.log('📚 API documentation will be at: http://localhost:3003/documentation');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('   1. Make sure MySQL is running and accessible');
  console.log('   2. Check your env.backend file has correct database credentials');
  console.log('   3. Ensure the database "reved_kids" exists');
  console.log('   4. Try running migrations manually: npm run migrate');
  console.log('   5. Try running seeding manually: npm run db:seed:comprehensive');
  process.exit(1);
}
