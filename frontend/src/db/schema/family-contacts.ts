import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { patients } from "./patients";

export const familyContacts = pgTable("family_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: text("phone").notNull(),
  preferredChannel: varchar("preferred_channel", { length: 10 }).default("sms").notNull(),
});

export const familyContactsRelations = relations(familyContacts, ({ one }) => ({
  patient: one(patients, {
    fields: [familyContacts.patientId],
    references: [patients.id],
  }),
}));