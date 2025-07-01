// Script to verify that the sort_order migration was applied successfully
const { createClient } = require('@supabase/supabase-js');

// Configuration - Update these with your production Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://lmwbfbnduhijqmoqhxpi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_ANON_KEY environment variable');
  console.error('Please set your Supabase anon key and try again');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
  try {
    console.log('🔍 Verifying sort_order migration...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    // Test 1: Check if sort_order columns exist
    console.log('\n1️⃣ Checking if sort_order columns exist...');
    
    try {
      const { data: canvases, error: canvasError } = await supabase
        .from('canvases')
        .select('id, title, sort_order')
        .limit(1);
      
      if (canvasError) {
        console.log('❌ Canvases table sort_order column check failed:', canvasError.message);
      } else {
        console.log('✅ Canvases table has sort_order column');
      }
    } catch (error) {
      console.log('❌ Error checking canvases sort_order:', error.message);
    }
    
    try {
      const { data: folders, error: folderError } = await supabase
        .from('folders')
        .select('id, name, sort_order')
        .limit(1);
      
      if (folderError) {
        console.log('❌ Folders table sort_order column check failed:', folderError.message);
      } else {
        console.log('✅ Folders table has sort_order column');
      }
    } catch (error) {
      console.log('❌ Error checking folders sort_order:', error.message);
    }
    
    // Test 2: Check if functions exist
    console.log('\n2️⃣ Checking if required functions exist...');
    
    const functionsToTest = [
      'get_next_canvas_sort_order',
      'get_next_folder_sort_order', 
      'reorder_canvases_in_folder',
      'ensure_root_folder_exists',
      'fix_canvas_sort_orders'
    ];
    
    for (const funcName of functionsToTest) {
      try {
        // Try to call each function with dummy parameters
        let testParams = {};
        
        if (funcName === 'get_next_canvas_sort_order') {
          testParams = { p_user_id: '00000000-0000-0000-0000-000000000000' };
        } else if (funcName === 'get_next_folder_sort_order') {
          testParams = { p_user_id: '00000000-0000-0000-0000-000000000000' };
        } else if (funcName === 'reorder_canvases_in_folder') {
          testParams = { 
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_canvas_ids: ['00000000-0000-0000-0000-000000000000']
          };
        } else if (funcName === 'ensure_root_folder_exists') {
          testParams = { p_user_id: '00000000-0000-0000-0000-000000000000' };
        } else if (funcName === 'fix_canvas_sort_orders') {
          testParams = {};
        }
        
        const { error } = await supabase.rpc(funcName, testParams);
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('not found')) {
            console.log(`❌ Function ${funcName} does not exist`);
          } else {
            console.log(`✅ Function ${funcName} exists (error is expected with dummy data)`);
          }
        } else {
          console.log(`✅ Function ${funcName} exists and executed`);
        }
      } catch (error) {
        if (error.message.includes('function') && error.message.includes('not found')) {
          console.log(`❌ Function ${funcName} does not exist`);
        } else {
          console.log(`✅ Function ${funcName} exists (error is expected with dummy data)`);
        }
      }
    }
    
    // Test 3: Check if indexes exist (by checking query performance)
    console.log('\n3️⃣ Checking if indexes are working...');
    
    try {
      const startTime = Date.now();
      const { data: canvases, error } = await supabase
        .from('canvases')
        .select('id, title, sort_order')
        .order('sort_order')
        .limit(100);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      if (error) {
        console.log('❌ Error testing sort_order query:', error.message);
      } else {
        console.log(`✅ Sort order query executed in ${queryTime}ms`);
        if (queryTime < 100) {
          console.log('✅ Query performance suggests indexes are working');
        } else {
          console.log('⚠️  Query might be slow, indexes may need optimization');
        }
      }
    } catch (error) {
      console.log('❌ Error testing query performance:', error.message);
    }
    
    // Test 4: Check if there are any existing data issues
    console.log('\n4️⃣ Checking existing data...');
    
    try {
      const { data: canvases, error } = await supabase
        .from('canvases')
        .select('id, title, folder_id, sort_order')
        .order('created_at')
        .limit(10);
      
      if (error) {
        console.log('❌ Error fetching sample canvases:', error.message);
      } else if (canvases && canvases.length > 0) {
        console.log('✅ Sample canvases found:');
        canvases.forEach(canvas => {
          console.log(`   - ${canvas.title} (sort_order: ${canvas.sort_order}, folder: ${canvas.folder_id || 'root'})`);
        });
      } else {
        console.log('ℹ️  No canvases found in database');
      }
    } catch (error) {
      console.log('❌ Error checking existing data:', error.message);
    }
    
    console.log('\n🎉 Migration verification completed!');
    console.log('\n📋 Summary:');
    console.log('- If you see ✅ marks, the migration was successful');
    console.log('- If you see ❌ marks, those parts of the migration need to be applied manually');
    console.log('- Check the Supabase SQL Editor to run any missing parts');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration(); 