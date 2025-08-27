const mysql = require('mysql2/promise');

async function fixGdprRequestsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔧 Fixing gdpr_requests table...');

    // Add ALL missing columns in one go
    const missingColumns = [
      'verification_token VARCHAR(255) NULL AFTER due_date',
      'verified_at TIMESTAMP NULL AFTER verification_token',
      'assigned_to VARCHAR(255) NULL AFTER verified_at',
      'processed_at TIMESTAMP NULL AFTER assigned_to',
      'completed_at TIMESTAMP NULL AFTER processed_at',
      'ip_address VARCHAR(45) NOT NULL AFTER completed_at',
      'user_agent TEXT NOT NULL AFTER ip_address',
      'verification_method VARCHAR(50) NOT NULL AFTER user_agent',
      'legal_basis VARCHAR(100) NULL AFTER verification_method',
      'response_details JSON NULL AFTER legal_basis',
      'actions_taken JSON NULL AFTER response_details',
      'exported_data JSON NULL AFTER actions_taken',
      'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
    ];

    for (const columnDef of missingColumns) {
      try {
        await connection.execute(`
          ALTER TABLE gdpr_requests 
          ADD COLUMN ${columnDef}
        `);
        console.log(`✅ Added column: ${columnDef.split(' ')[0]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️ Column already exists: ${columnDef.split(' ')[0]}`);
        } else {
          throw error;
        }
      }
    }

    // Fix column sizes for data truncation issues
    try {
      await connection.execute(`
        ALTER TABLE gdpr_requests 
        MODIFY COLUMN request_type VARCHAR(100) NOT NULL
      `);
      console.log('✅ Fixed request_type column size');
    } catch (error) {
      console.log(`ℹ️ request_type column already correct size: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE gdpr_requests 
        MODIFY COLUMN status VARCHAR(100) NOT NULL
      `);
      console.log('✅ Fixed status column size');
    } catch (error) {
      console.log(`ℹ️ status column already correct size: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE gdpr_requests 
        MODIFY COLUMN student_id INT NULL
      `);
      console.log('✅ Made student_id nullable');
    } catch (error) {
      console.log(`ℹ️ student_id column already nullable: ${error.message}`);
    }

    console.log('🎉 gdpr_requests table fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing gdpr_requests table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
fixGdprRequestsTable().catch(console.error);
