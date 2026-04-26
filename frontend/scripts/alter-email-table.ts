import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function alterEmailsTable() {
  try {
    console.log("Altering emails table...");
    await sql`ALTER TABLE emails RENAME COLUMN title TO body;`;
    await sql`ALTER TABLE emails ALTER COLUMN body TYPE TEXT;`;
    console.log("Successfully altered emails table!");
  } catch (error) {
    console.error("Error altering emails table:", error);
  } finally {
    await sql.end();
  }
}

alterEmailsTable();
