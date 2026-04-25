import { pgTable, uuid, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rooms } from "./rooms";
import { nurses } from "./nurses";

export const roundingLogs = pgTable("rounding_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id).notNull(),
  nurseId: uuid("nurse_id").references(() => nurses.id),
  enteredAt: timestamp("entered_at", { withTimezone: true }).defaultNow().notNull(),
  sanitized: boolean("sanitized").default(false).notNull(),
  durationSec: integer("duration_sec"),
});

export const roundingLogsRelations = relations(roundingLogs, ({ one }) => ({
  room: one(rooms, {
    fields: [roundingLogs.roomId],
    references: [rooms.id],
  }),
  nurse: one(nurses, {
    fields: [roundingLogs.nurseId],
    references: [nurses.id],
  }),
}));