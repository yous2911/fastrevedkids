const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '../src/tests/gdpr-database.test.ts');

async function fixSyntaxErrors() {
  try {
    console.log('🔧 Fixing syntax errors in gdpr-database.test.ts...');
    
    let content = fs.readFileSync(testFile, 'utf8');
    
    // Fix the broken regex replacements by restoring proper syntax
    content = content.replace(
      /const \[([^\]]+)\] = await db\.insert\(([^)]+)\)\.values\(([^)]+)\);/g,
      (match, varName, tableName, values) => {
        return `await db.insert(${tableName}).values(${values});\n      const [${varName}] = await db.select().from(${tableName}).where(eq(${tableName}.id, ${values.match(/id:\s*([^,}]+)/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Fix specific patterns that got corrupted
    content = content.replace(
      /const \[consent\] = await db\.insert\(parentalConsent\)\.values\(([^)]+)\);/g,
      (match, values) => {
        const idMatch = values.match(/id:\s*([^,}]+)/);
        const id = idMatch ? idMatch[1] : 'uuidv4()';
        return `await db.insert(parentalConsent).values(${values});\n      const [consent] = await db.select().from(parentalConsent).where(eq(parentalConsent.id, ${id}));`;
      }
    );
    
    content = content.replace(
      /const \[request\] = await db\.insert\(gdprRequests\)\.values\(([^)]+)\);/g,
      (match, values) => {
        const idMatch = values.match(/id:\s*([^,}]+)/);
        const id = idMatch ? idMatch[1] : 'uuidv4()';
        return `await db.insert(gdprRequests).values(${values});\n      const [request] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, ${id}));`;
      }
    );
    
    content = content.replace(
      /const \[inserted\] = await db\.insert\(auditLogs\)\.values\(([^)]+)\);/g,
      (match, values) => {
        const idMatch = values.match(/id:\s*([^,}]+)/);
        const id = idMatch ? idMatch[1] : 'uuidv4()';
        return `await db.insert(auditLogs).values(${values});\n      const [inserted] = await db.select().from(auditLogs).where(eq(auditLogs.id, ${id}));`;
      }
    );
    
    content = content.replace(
      /const \[inserted\] = await db\.insert\(encryptionKeys\)\.values\(([^)]+)\);/g,
      (match, values) => {
        const idMatch = values.match(/id:\s*([^,}]+)/);
        const id = idMatch ? idMatch[1] : 'uuidv4()';
        return `await db.insert(encryptionKeys).values(${values});\n      const [inserted] = await db.select().from(encryptionKeys).where(eq(encryptionKeys.id, ${id}));`;
      }
    );
    
    content = content.replace(
      /const \[inserted\] = await db\.insert\(retentionPolicies\)\.values\(([^)]+)\);/g,
      (match, values) => {
        const idMatch = values.match(/id:\s*([^,}]+)/);
        const id = idMatch ? idMatch[1] : 'uuidv4()';
        return `await db.insert(retentionPolicies).values(${values});\n      const [inserted] = await db.select().from(retentionPolicies).where(eq(retentionPolicies.id, ${id}));`;
      }
    );
    
    // Write the fixed content back
    fs.writeFileSync(testFile, content, 'utf8');
    
    console.log('✅ Syntax errors fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing syntax errors:', error);
    throw error;
  }
}

// Run the script
fixSyntaxErrors().catch(console.error);
