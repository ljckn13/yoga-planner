// Test script to verify sort order logic
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSortOrders() {
  try {
    console.log('🧪 Testing sort order logic...');
    
    // Get a test user (replace with actual user ID)
    const testUserId = 'your-test-user-id';
    
    // Check current state
    console.log('📊 Current canvas state:');
    const { data: canvases, error: fetchError } = await supabase
      .from('canvases')
      .select('id, title, folder_id, sort_order, created_at')
      .eq('user_id', testUserId)
      .order('folder_id, sort_order');
      
    if (fetchError) {
      console.error('❌ Error fetching canvases:', fetchError);
      return;
    }
    
    console.log('Current canvases:');
    canvases?.forEach(canvas => {
      console.log(`  - ${canvas.title} (folder: ${canvas.folder_id || 'root'}, sort_order: ${canvas.sort_order})`);
    });
    
    // Test moving a canvas
    if (canvases && canvases.length >= 2) {
      const sourceCanvas = canvases[0];
      const targetCanvas = canvases[1];
      
      console.log(`\n🔄 Testing move: ${sourceCanvas.title} to folder ${targetCanvas.folder_id || 'root'}`);
      
      // Call the move function
      const { error: moveError } = await supabase
        .rpc('test_move_canvas', {
          p_user_id: testUserId,
          p_canvas_id: sourceCanvas.id,
          p_target_folder_id: targetCanvas.folder_id
        });
        
      if (moveError) {
        console.error('❌ Error moving canvas:', moveError);
        return;
      }
      
      console.log('✅ Move completed');
      
      // Check state after move
      console.log('\n📊 State after move:');
      const { data: canvasesAfter, error: fetchAfterError } = await supabase
        .from('canvases')
        .select('id, title, folder_id, sort_order, created_at')
        .eq('user_id', testUserId)
        .order('folder_id, sort_order');
        
      if (fetchAfterError) {
        console.error('❌ Error fetching canvases after move:', fetchAfterError);
        return;
      }
      
      console.log('Canvases after move:');
      canvasesAfter?.forEach(canvas => {
        console.log(`  - ${canvas.title} (folder: ${canvas.folder_id || 'root'}, sort_order: ${canvas.sort_order})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing sort orders:', error);
  }
}

// Run the test
testSortOrders(); 