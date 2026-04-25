import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nurses } from "./nurses";
import { rooms } from "./rooms";
import { patients } from "./patients";

export const nurseStatuses = pgTable("nurse_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  nurseId: uuid("nurse_id").references(() => nurses.id).notNull(),
  status: varchar("status", { length: 20 }).default("available").notNull(),
  currentRoomId: uuid("current_room_id").references(() => rooms.id),
  currentPatientId: uuid("current_patient_id").references(() => patients.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nurseStatusesRelations = relations(nurseStatuses, ({ one }) => ({
  nurse: one(nurses, {
    fields: [nurseStatuses.nurseId],
    references: [nurses.id],
  }),
  room: one(rooms, {
    fields: [nurseStatuses.currentRoomId],
    references: [rooms.id],
  }),
  patient: one(patients, {
    fields: [nurseStatuses.currentPatientId],
    references: [patients.id],
  }),
}));