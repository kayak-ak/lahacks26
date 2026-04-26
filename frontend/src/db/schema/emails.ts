import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { patients } from "./patients";

export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailsRelations = relations(emails, ({ one }) => ({
  patient: one(patients, {
    fields: [emails.patientId],
    references: [patients.id],
  }),
}));
