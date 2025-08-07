import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('Starting absensup keepalive job...');

    // Generate random data
    const randomData = `keepalive_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Insert new random data
    const { error: insertError } = await supabaseClient
      .from('absensup')
      .insert({ data: randomData });

    if (insertError) {
      console.error('Error inserting data:', insertError);
      throw insertError;
    }

    console.log('Inserted new keepalive data:', randomData);

    // Count total records
    const { count, error: countError } = await supabaseClient
      .from('absensup')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting records:', countError);
      throw countError;
    }

    console.log('Total records in absensup:', count);

    // If more than 10 records, delete the oldest ones
    if (count && count > 10) {
      const recordsToDelete = count - 10;
      
      // Get oldest records to delete
      const { data: oldestRecords, error: fetchError } = await supabaseClient
        .from('absensup')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(recordsToDelete);

      if (fetchError) {
        console.error('Error fetching oldest records:', fetchError);
        throw fetchError;
      }

      if (oldestRecords && oldestRecords.length > 0) {
        const idsToDelete = oldestRecords.map(record => record.id);
        
        const { error: deleteError } = await supabaseClient
          .from('absensup')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Error deleting old records:', deleteError);
          throw deleteError;
        }

        console.log(`Deleted ${recordsToDelete} old records`);
      }
    }

    const result = {
      success: true,
      message: 'Keepalive job completed successfully',
      timestamp: new Date().toISOString(),
      inserted_data: randomData,
      total_records: count,
      deleted_count: count && count > 10 ? count - 10 : 0
    };

    console.log('Keepalive job result:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in absensup keepalive job:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});