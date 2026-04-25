import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { rooms } from "./rooms";

export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  roomId: uuid("room_id").references(() => rooms.id),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  room: one(rooms, {
    fields: [alerts.roomId],
    references: [rooms.id],
  }),
}));