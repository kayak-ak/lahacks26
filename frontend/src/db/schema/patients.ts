import { pgTable, uuid, varchar, timestamp, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rooms } from "./rooms";
import { familyContacts } from "./family-contacts";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id),
  name: varchar("name", { length: 100 }).notNull(),
  acuityLevel: integer("acuity_level").default(1).notNull(),
  admittedAt: timestamp("admitted_at", { withTimezone: true }).defaultNow().notNull(),
  familyPhone: text("family_phone"),
});

export const patientsRelations = relations(patients, ({ one, many }) => ({
  room: one(rooms, {
    fields: [patients.roomId],
    references: [rooms.id],
  }),
  familyContacts: many(familyContacts),
}));