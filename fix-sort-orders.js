// Script to fix corrupted sort_order values in the database
// Run this script to reset all sort_order values to be sequential within each folder

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSortOrders() {
  try {
    console.log('🔧 Fixing corrupted sort_order values...');
    
    // First, run the migration to update the database function
    console.log('📝 Updating database functions...');
    
    // Reset sort_order for canvases within each folder
    const { error: updateError } = await supabase.rpc('fix_canvas_sort_orders');
    
    if (updateError) {
      console.error('❌ Error updating sort orders:', updateError);
      return;
    }
    
    console.log('✅ Sort orders fixed successfully!');
    
    // Verify the fix by checking a few canvases
    const { data: sampleCanvases, error: fetchError } = await supabase
      .from('canvases')
      .select('id, title, folder_id, sort_order')
      .limit(10)
      .order('folder_id, sort_order');
      
    if (fetchError) {
      console.error('❌ Error fetching sample data:', fetchError);
      return;
    }
    
    console.log('📊 Sample canvases after fix:');
    sampleCanvases?.forEach(canvas => {
      console.log(`  - ${canvas.title} (folder: ${canvas.folder_id || 'root'}, sort_order: ${canvas.sort_order})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing sort orders:', error);
  }
}

// Run the fix
fixSortOrders(); 