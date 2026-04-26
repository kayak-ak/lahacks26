import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function addMoreEmails() {
  try {
    console.log("Fetching patients...");
    const patients = await sql`SELECT id, name FROM patients LIMIT 5`;
    
    if (patients.length === 0) {
      console.log("No patients found to link emails to.");
      return;
    }

    console.log("Adding more test emails...");
    
    const newEmails = [
      { subject: "Lab Results Ready", body: "The recent blood work results are available. Everything looks normal.", offsetMinutes: 5 },
      { subject: "Physical Therapy Scheduled", body: "PT session confirmed for tomorrow at 10 AM.", offsetMinutes: 45 },
      { subject: "Dietary Preferences Updated", body: "The patient's dietary preferences have been updated to vegetarian.", offsetMinutes: 120 },
      { subject: "Family Visitation Approved", body: "Family visitation has been approved for the upcoming weekend.", offsetMinutes: 200 },
      { subject: "Prescription Refill", body: "Prescription for Amoxicillin has been refilled successfully.", offsetMinutes: 300 },
      { subject: "Vital Signs Check", body: "Vitals remain stable during the overnight observation.", offsetMinutes: 1440 },
      { subject: "Discharge Instructions", body: "Please review the attached discharge instructions before leaving.", offsetMinutes: 2880 },
      { subject: "Follow-up Appointment", body: "A follow-up appointment is scheduled in two weeks.", offsetMinutes: 4320 },
      { subject: "Insurance Verification", body: "Insurance details have been successfully verified and processed.", offsetMinutes: 5760 },
      { subject: "Billing Statement", body: "Your recent billing statement is attached for review.", offsetMinutes: 7200 },
      { subject: "Welcome to Care", body: "Welcome to our facility. We are committed to your rapid recovery.", offsetMinutes: 8640 },
      { subject: "Patient Portal Access", body: "Instructions to access the online patient portal have been sent.", offsetMinutes: 10000 },
    ];

    let inserted = 0;
    for (let i = 0; i < newEmails.length; i++) {
      const email = newEmails[i];
      const patient = patients[i % patients.length];
      
      await sql`
        INSERT INTO emails (patient_id, subject, body, created_at)
        VALUES (
          ${patient.id}, 
          ${email.subject}, 
          ${email.body}, 
          NOW() - INTERVAL '1 minute' * ${email.offsetMinutes}
        )
      `;
      inserted++;
    }

    console.log(`Successfully added ${inserted} more emails!`);
  } catch (error) {
    console.error("Error adding emails:", error);
  } finally {
    await sql.end();
  }
}

addMoreEmails();
