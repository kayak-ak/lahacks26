import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function seedEmails() {
  try {
    const patients = await sql`SELECT id, name FROM patients LIMIT 3`;
    if (patients.length === 0) {
      console.log("No patients found to seed emails for");
      return;
    }

    console.log("Seeding emails...");
    await sql`
      INSERT INTO emails (patient_id, subject, title)
      VALUES 
        (${patients[0].id}, 'Update on condition', 'Patient is stable and recovering well'),
        (${patients[1].id}, 'Medication change', 'New medication schedule for the next 24 hours'),
        (${patients[2].id}, 'Discharge plan', 'Preparing for discharge tomorrow morning')
    `;
    console.log("Successfully seeded emails!");
  } catch (error) {
    console.error("Error seeding emails:", error);
  } finally {
    await sql.end();
  }
}

seedEmails();
