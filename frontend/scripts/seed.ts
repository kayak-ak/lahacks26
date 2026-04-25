import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "")!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding database...");

  console.log("Inserting rooms...");
  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .insert([
        { number: "101", status: "occupied" },
        { number: "102", status: "occupied" },
        { number: "103", status: "vacant" },
        { number: "104", status: "occupied" },
        { number: "201", status: "occupied" },
        { number: "202", status: "needs_cleaning" },
        { number: "203", status: "vacant" },
        { number: "204", status: "occupied" },
      ])
    .select();

  if (roomsError) {
    console.error("Error inserting rooms:", roomsError);
    process.exit(1);
  }
  console.log(`Inserted ${roomsData?.length} rooms`);

  console.log("Inserting nurses...");
  const { data: nursesData, error: nursesError } = await supabase
    .from("nurses")
    .insert([
        { name: "Sarah Chen", role: "head_nurse", phone: "+15551001", email: "sarah.chen@hospital.org", floor_assignment: "1" },
        { name: "Marcus Johnson", role: "nurse", phone: "+15551002", email: "marcus.j@hospital.org", floor_assignment: "1" },
        { name: "Emily Rodriguez", role: "nurse", phone: "+15551003", email: "emily.r@hospital.org", floor_assignment: "2" },
        { name: "David Kim", role: "nurse", phone: "+15551004", email: "david.k@hospital.org", floor_assignment: "2" },
      ])
    .select();

  if (nursesError) {
    console.error("Error inserting nurses:", nursesError);
    process.exit(1);
  }
  console.log(`Inserted ${nursesData?.length} nurses`);

  console.log("Inserting patients...");
  const { data: patientsData, error: patientsError } = await supabase
    .from("patients")
    .insert([
      { name: "James Wilson", acuity_level: 3, family_phone: "+15552001" },
      { name: "Maria Garcia", acuity_level: 2, family_phone: "+15552002" },
      { name: "Robert Thompson", acuity_level: 4, family_phone: "+15552003" },
      { name: "Linda Patel", acuity_level: 1, family_phone: "+15552004" },
    ])
    .select();

  if (patientsError) {
    console.error("Error inserting patients:", patientsError);
    process.exit(1);
  }
  console.log(`Inserted ${patientsData?.length} patients`);

  console.log("Inserting family contacts...");
  for (const patient of patientsData ?? []) {
    await supabase.from("family_contacts").insert({
      patient_id: patient.id,
      name: `Family of ${patient.name}`,
      phone: patient.family_phone ?? "+15559999",
      preferred_channel: "sms",
    });
  }
  console.log("Inserted family contacts");

  console.log("Inserting shifts...");
  await supabase.from("shifts").insert([
    { nurse_id: nursesData![0].id, date: "2026-04-24", time_slot: "07:00-15:00", status: "confirmed" },
    { nurse_id: nursesData![1].id, date: "2026-04-24", time_slot: "07:00-15:00", status: "confirmed" },
    { nurse_id: nursesData![2].id, date: "2026-04-24", time_slot: "15:00-23:00", status: "scheduled" },
    { nurse_id: nursesData![3].id, date: "2026-04-24", time_slot: "15:00-23:00", status: "scheduled" },
  ]);
  console.log("Inserted shifts");

  console.log("Seed complete!");
}

seed().catch(console.error);