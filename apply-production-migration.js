// Script to apply production migration for sort_order support
// This script will run the migration on your production Supabase database

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration - Update these with your production Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://lmwbfbnduhijqmoqhxpi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for migrations

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Please set your Supabase service role key and try again');
  console.error('You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyProductionMigration() {
  try {
    console.log('🚀 Starting production migration for sort_order support...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240101000008_production_sort_order_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} migration statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`  [${i + 1}/${statements.length}] Executing statement...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // If exec_sql doesn't exist, try direct query
            const { error: directError } = await supabase.from('_dummy_').select('*').limit(0);
            if (directError && directError.message.includes('exec_sql')) {
              console.log('  ⚠️  exec_sql function not available, trying alternative approach...');
              // For now, we'll need to run this manually in the Supabase SQL editor
              console.log('  📋 Please run the following SQL in your Supabase SQL Editor:');
              console.log('  ' + '='.repeat(80));
              console.log(statement + ';');
              console.log('  ' + '='.repeat(80));
            } else {
              throw error;
            }
          } else {
            console.log(`  ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (stmtError) {
          console.error(`  ❌ Error executing statement ${i + 1}:`, stmtError.message);
          console.log('  📋 Statement was:');
          console.log('  ' + statement);
          console.log('');
        }
      }
    }
    
    console.log('');
    console.log('🎉 Migration completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. If any statements failed, run them manually in your Supabase SQL Editor');
    console.log('2. Test the application to ensure sort_order functionality works');
    console.log('3. Check that drag-and-drop reordering works properly');
    console.log('');
    console.log('🔍 To verify the migration, you can run:');
    console.log('   node test-sort-orders.js');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Manual migration instructions
function showManualMigrationInstructions() {
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('================================');
  console.log('');
  console.log('Since automated migration might not work, here are manual steps:');
  console.log('');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: lmwbfbnduhijqmoqhxpi');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of: supabase/migrations/20240101000008_production_sort_order_migration.sql');
  console.log('5. Click "Run" to execute the migration');
  console.log('');
  console.log('After running the migration:');
  console.log('- Test creating new canvases');
  console.log('- Test drag-and-drop reordering');
  console.log('- Test moving canvases between folders');
  console.log('');
}

// Check if we should show manual instructions
if (process.argv.includes('--manual')) {
  showManualMigrationInstructions();
} else {
  applyProductionMigration();
} 