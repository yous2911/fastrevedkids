#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env.backend') });

async function checkMascots() {
  console.log('🔍 Checking mascot data in database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reved_kids'
  });

  try {
    const [rows] = await connection.execute(`
      SELECT id, prenom, nom, mascotte_type, mascotte_color 
      FROM students 
      ORDER BY id
    `);
    
    console.log('\n📊 Current Mascot Data:');
    console.log('ID | Name           | Mascot Type | Color');
    console.log('---|----------------|-------------|-------');
    
    rows.forEach(row => {
      console.log(`${row.id.toString().padStart(2)} | ${(row.prenom + ' ' + row.nom).padEnd(14)} | ${row.mascotte_type.padEnd(11)} | ${row.mascotte_color}`);
    });
    
    console.log('\n💡 Current mascots are stored as text strings, not emojis or 3D models.');
    console.log('   - dragon, unicorn, robot, cat are text identifiers');
    console.log('   - These would typically map to emoji or 3D model assets in the frontend');
    
  } catch (error) {
    console.error('❌ Error checking mascots:', error.message);
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkMascots()
    .then(() => {
      console.log('\n✅ Mascot check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Mascot check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkMascots };
