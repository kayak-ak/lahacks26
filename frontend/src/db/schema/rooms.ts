import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: varchar("number", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).default("vacant").notNull(),
  lastRoundedAt: timestamp("last_rounded_at", { withTimezone: true }),
  lastSanitizedAt: timestamp("last_sanitized_at", { withTimezone: true }),
  cameraFeedUrl: text("camera_feed_url"),
});