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

async function run() {
  console.log("Inserting test patient...");
  const { data, error } = await supabase.from('patients').insert({
    name: "John Doe (Test)",
    acuity_level: 2,
    age: 45,
    reason: "Test Patient Creation",
    family_phone: "555-0199"
  }).select().single();

  if (error) {
    console.error("❌ Failed to create patient:", error);
  } else {
    console.log("✅ Successfully created patient:");
    console.log(data);
    console.log(`\nPatient ID to use for logs: ${data.id}`);
  }
}

run();
