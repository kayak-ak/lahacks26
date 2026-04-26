import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).default("vacant").notNull(),
  roomType: varchar("room_type", { length: 20 }).default("patient").notNull(),
  lastRoundedAt: timestamp("last_rounded_at", { withTimezone: true }),
  lastSanitizedAt: timestamp("last_sanitized_at", { withTimezone: true }),
  cameraFeedUrl: text("camera_feed_url"),
});