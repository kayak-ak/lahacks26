import { pgTable, uuid, varchar, date, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nurses } from "./nurses";

export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  nurseId: uuid("nurse_id").references(() => nurses.id),
  date: date("date").notNull(),
  timeSlot: varchar("time_slot", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shiftsRelations = relations(shifts, ({ one }) => ({
  nurse: one(nurses, {
    fields: [shifts.nurseId],
    references: [nurses.id],
  }),
}));