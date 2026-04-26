import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("1. Testing insert into 'events' table...");
  const testPayload = {
    patient_id: "test-p1",
    patient_name: "Test Patient",
    notes: "This is a test log from script",
    occurred_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase.from('events').insert({
    type: 'neutral',
    payload: testPayload
  }).select().single();

  if (insertError) {
    console.error("❌ Failed to insert patient log:", insertError);
    return;
  }
  console.log("✅ Successfully inserted log:", insertData);

  const insertedId = insertData.id;

  console.log("\n2. Testing pull from 'events' table...");
  const { data: pullData, error: pullError } = await supabase
    .from('events')
    .select('*')
    .eq('id', insertedId)
    .single();

  if (pullError) {
    console.error("❌ Failed to pull patient log:", pullError);
    return;
  }
  console.log("✅ Successfully pulled log:", pullData);

  console.log("\n3. Cleaning up test data...");
  const { error: deleteError } = await supabase.from('events').delete().eq('id', insertedId);
  if (deleteError) {
    console.error("❌ Failed to delete test log:", deleteError);
  } else {
    console.log("✅ Successfully cleaned up test log.");
  }
}

runTest();
