const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '../src/tests/gdpr-database.test.ts');

async function fixForeignKeys() {
  try {
    console.log('🔧 Fixing foreign key constraints in gdpr-database.test.ts...');
    
    let content = fs.readFileSync(testFile, 'utf8');
    
    // Fix student_id references to use valid IDs instead of 999
    content = content.replace(/studentId:\s*999/g, 'studentId: 1');
    
    // Fix any other hardcoded invalid IDs
    content = content.replace(/student_id:\s*999/g, 'student_id: 1');
    
    // Write the fixed content back
    fs.writeFileSync(testFile, content, 'utf8');
    
    console.log('✅ Foreign key constraints fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing foreign key constraints:', error);
    throw error;
  }
}

// Run the script
fixForeignKeys().catch(console.error);
