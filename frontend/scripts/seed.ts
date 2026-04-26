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

  // Clean existing data (in dependency order)
  console.log("Cleaning existing data...");
  await supabase.from("vitals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("family_contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("rounding_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("nurse_statuses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("shifts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("patients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("nurses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Insert rooms
  console.log("Inserting rooms...");
  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .insert([
      { number: "101", status: "occupied", room_type: "patient" },
      { number: "102", status: "occupied", room_type: "patient" },
      { number: "103", status: "vacant", room_type: "patient" },
      { number: "104", status: "vacant", room_type: "patient" },
      { number: "105", status: "occupied", room_type: "patient" },
      { number: "106", status: "occupied", room_type: "patient" },
      { number: "107", status: "occupied", room_type: "patient" },
      { number: "108", status: "occupied", room_type: "patient" },
      { number: "Exam Room 1", status: "vacant", room_type: "exam" },
      { number: "Exam Room 2", status: "occupied", room_type: "exam" },
      { number: "Exam Room 3", status: "needs_cleaning", room_type: "exam" },
      { number: "Exam Room 4", status: "occupied", room_type: "exam" },
      { number: "Triage Room", status: "occupied", room_type: "triage" },
      { number: "Emergency Room", status: "vacant", room_type: "emergency" },
    ])
    .select();

  if (roomsError) {
    console.error("Error inserting rooms:", roomsError);
    process.exit(1);
  }
  console.log(`Inserted ${roomsData?.length} rooms`);

  // Helper to find room by number
  const roomByNumber = (number: string) => roomsData!.find((r: any) => r.number === number);

  // Insert nurses
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

  // Insert patients
  console.log("Inserting patients...");
  const patientsSeed = [
    { name: "Sarah Johnson", acuity_level: 1, room_id: roomByNumber("101")?.id, age: 34, reason: "Post-operative recovery", family_phone: "+15552001" },
    { name: "Michael Chen", acuity_level: 4, room_id: roomByNumber("102")?.id, age: 67, reason: "Cardiac monitoring", family_phone: "+15552002" },
    { name: "Emma Davis", acuity_level: 2, room_id: roomByNumber("105")?.id, age: 45, reason: "Post-surgical observation", family_phone: "+15552003" },
    { name: "Linda Patel", acuity_level: 1, room_id: roomByNumber("106")?.id, age: 29, reason: "Routine monitoring", family_phone: "+15552004" },
    { name: "James Wilson", acuity_level: 3, room_id: roomByNumber("107")?.id, age: 58, reason: "Mobility assessment", family_phone: "+15552005" },
    { name: "Olivia Martinez", acuity_level: 4, room_id: roomByNumber("108")?.id, age: 72, reason: "Cardiac monitoring", family_phone: "+15552006" },
    { name: "David Smith", acuity_level: 1, room_id: roomByNumber("Exam Room 2")?.id, age: 41, reason: "Consultation", family_phone: "+15552007" },
    { name: "Lisa Wong", acuity_level: 2, room_id: roomByNumber("Exam Room 4")?.id, age: 53, reason: "Post-procedure observation", family_phone: "+15552008" },
    { name: "Alex Rivera", acuity_level: 5, room_id: roomByNumber("Triage Room")?.id, age: 38, reason: "Emergency intake", family_phone: "+15552009" },
  ];

  const { data: patientsData, error: patientsError } = await supabase
    .from("patients")
    .insert(patientsSeed)
    .select();

  if (patientsError) {
    console.error("Error inserting patients:", patientsError);
    process.exit(1);
  }
  console.log(`Inserted ${patientsData?.length} patients`);

  // Insert family contacts
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

  // Insert vitals
  console.log("Inserting vitals...");
  const vitalsLookup: Record<string, { heart_rate: number; bp_systolic: number; bp_diastolic: number; temperature_f: number; oxygen_saturation: number }> = {
    "Sarah Johnson": { heart_rate: 76, bp_systolic: 118, bp_diastolic: 78, temperature_f: 98.4, oxygen_saturation: 98 },
    "Michael Chen": { heart_rate: 115, bp_systolic: 145, bp_diastolic: 95, temperature_f: 101.2, oxygen_saturation: 92 },
    "Emma Davis": { heart_rate: 82, bp_systolic: 121, bp_diastolic: 80, temperature_f: 98.8, oxygen_saturation: 97 },
    "Linda Patel": { heart_rate: 72, bp_systolic: 116, bp_diastolic: 74, temperature_f: 98.3, oxygen_saturation: 99 },
    "James Wilson": { heart_rate: 91, bp_systolic: 132, bp_diastolic: 84, temperature_f: 99.5, oxygen_saturation: 95 },
    "Olivia Martinez": { heart_rate: 122, bp_systolic: 148, bp_diastolic: 98, temperature_f: 100.7, oxygen_saturation: 90 },
    "David Smith": { heart_rate: 78, bp_systolic: 120, bp_diastolic: 80, temperature_f: 98.6, oxygen_saturation: 98 },
    "Lisa Wong": { heart_rate: 85, bp_systolic: 125, bp_diastolic: 82, temperature_f: 99.1, oxygen_saturation: 96 },
    "Alex Rivera": { heart_rate: 130, bp_systolic: 150, bp_diastolic: 100, temperature_f: 101.5, oxygen_saturation: 88 },
  };

  for (const patient of patientsData ?? []) {
    const v = vitalsLookup[patient.name];
    if (v) {
      await supabase.from("vitals").insert({
        patient_id: patient.id,
        ...v,
      });
    }
  }
  console.log("Inserted vitals");

  // Insert alerts
  console.log("Inserting alerts...");
  await supabase.from("alerts").insert([
    { type: "vitals", room_id: roomByNumber("102")?.id, priority: "critical", message: "Heart rate anomaly detected" },
    { type: "vitals", room_id: roomByNumber("108")?.id, priority: "critical", message: "Escalation routed to floor nurse" },
    { type: "vitals", room_id: roomByNumber("Triage Room")?.id, priority: "critical", message: "Initial assessment" },
    { type: "rounding", room_id: roomByNumber("107")?.id, priority: "medium", message: "Mobility check due soon" },
    { type: "medication", room_id: roomByNumber("106")?.id, priority: "low", message: "Medication cycle completed" },
    { type: "vitals", room_id: roomByNumber("105")?.id, priority: "low", message: "Vitals within expected range" },
  ]);
  console.log("Inserted alerts");

  // Insert shifts
  console.log("Inserting shifts...");
  await supabase.from("shifts").insert([
    { nurse_id: nursesData![0].id, date: "2026-04-25", time_slot: "07:00-15:00", status: "confirmed" },
    { nurse_id: nursesData![1].id, date: "2026-04-25", time_slot: "07:00-15:00", status: "confirmed" },
    { nurse_id: nursesData![2].id, date: "2026-04-25", time_slot: "15:00-23:00", status: "scheduled" },
    { nurse_id: nursesData![3].id, date: "2026-04-25", time_slot: "15:00-23:00", status: "scheduled" },
    { nurse_id: nursesData![0].id, date: "2026-04-25", time_slot: "15:00-23:00", status: "scheduled" },
    { nurse_id: nursesData![1].id, date: "2026-04-25", time_slot: "15:00-23:00", status: "scheduled" },
  ]);
  console.log("Inserted shifts");

  // Insert nurse statuses
  console.log("Inserting nurse statuses...");
  await supabase.from("nurse_statuses").insert([
    { nurse_id: nursesData![0].id, status: "busy", current_room_id: roomByNumber("101")?.id, current_patient_id: patientsData!.find((p: any) => p.name === "Sarah Johnson")?.id },
    { nurse_id: nursesData![1].id, status: "busy", current_room_id: roomByNumber("102")?.id, current_patient_id: patientsData!.find((p: any) => p.name === "Michael Chen")?.id },
    { nurse_id: nursesData![2].id, status: "busy", current_room_id: roomByNumber("108")?.id, current_patient_id: patientsData!.find((p: any) => p.name === "Olivia Martinez")?.id },
    { nurse_id: nursesData![3].id, status: "break" },
  ]);
  console.log("Inserted nurse statuses");

  console.log("Seed complete!");
}

seed().catch(console.error);