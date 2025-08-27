const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '../src/tests/gdpr-database.test.ts');

async function fixMySqlSyntax() {
  try {
    console.log('🔧 Fixing MySQL syntax in gdpr-database.test.ts...');
    
    let content = fs.readFileSync(testFile, 'utf8');
    
    // Pattern 1: Replace db.insert(...).values(...).returning() with separate insert and select
    content = content.replace(
      /const \[([^\]]+)\] = await db\.insert\(([^)]+)\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, varName, tableName, values) => {
        return `await db.insert(${tableName}).values(${values});\n      const [${varName}] = await db.select().from(${tableName}).where(eq(${tableName}.id, ${varName}?.id || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 2: Replace simpler .returning() calls
    content = content.replace(
      /\.returning\(\);/g,
      ';'
    );
    
    // Pattern 3: Fix specific patterns for students table
    content = content.replace(
      /const \[student\] = await db\.insert\(students\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(students).values(${values});\n      const [student] = await db.select().from(students).where(eq(students.prenom, ${values.match(/prenom:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 4: Fix consent patterns
    content = content.replace(
      /const \[consent\] = await db\.insert\(parentalConsent\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(parentalConsent).values(${values});\n      const [consent] = await db.select().from(parentalConsent).where(eq(parentalConsent.parentEmail, ${values.match(/parentEmail:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 5: Fix request patterns
    content = content.replace(
      /const \[request\] = await db\.insert\(gdprRequests\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(gdprRequests).values(${values});\n      const [request] = await db.select().from(gdprRequests).where(eq(gdprRequests.requesterEmail, ${values.match(/requesterEmail:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 6: Fix audit log patterns
    content = content.replace(
      /const \[inserted\] = await db\.insert\(auditLogs\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(auditLogs).values(${values});\n      const [inserted] = await db.select().from(auditLogs).where(eq(auditLogs.entityType, ${values.match(/entityType:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 7: Fix encryption key patterns
    content = content.replace(
      /const \[inserted\] = await db\.insert\(encryptionKeys\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(encryptionKeys).values(${values});\n      const [inserted] = await db.select().from(encryptionKeys).where(eq(encryptionKeys.usage, ${values.match(/usage:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 8: Fix retention policy patterns
    content = content.replace(
      /const \[inserted\] = await db\.insert\(retentionPolicies\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(retentionPolicies).values(${values});\n      const [inserted] = await db.select().from(retentionPolicies).where(eq(retentionPolicies.policyName, ${values.match(/policyName:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 9: Fix consent preferences patterns
    content = content.replace(
      /const \[student\] = await db\.insert\(students\)\.values\(([^)]+)\)\.returning\(\);/g,
      (match, values) => {
        return `await db.insert(students).values(${values});\n      const [student] = await db.select().from(students).where(eq(students.prenom, ${values.match(/prenom:\s*'([^']+)'/)?.[1] || 'last_insert_id()'}));`;
      }
    );
    
    // Pattern 10: Fix any remaining .returning() calls
    content = content.replace(/\.returning\(\)/g, '');
    
    // Write the fixed content back
    fs.writeFileSync(testFile, content, 'utf8');
    
    console.log('✅ MySQL syntax fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing MySQL syntax:', error);
    throw error;
  }
}

// Run the script
fixMySqlSyntax().catch(console.error);
