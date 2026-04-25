import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

export const nurses = pgTable("nurses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).default("nurse").notNull(),
  phone: text("phone"),
  email: text("email"),
  floorAssignment: varchar("floor_assignment", { length: 10 }),
});