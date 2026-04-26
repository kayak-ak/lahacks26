import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function createEmailsTable() {
  try {
    console.log("Creating emails table...");
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id),
        subject VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Successfully created emails table!");
  } catch (error) {
    console.error("Error creating emails table:", error);
  } finally {
    await sql.end();
  }
}

createEmailsTable();
