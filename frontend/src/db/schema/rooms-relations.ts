import { relations } from "drizzle-orm";
import { rooms } from "./rooms";
import { patients } from "./patients";
import { roundingLogs } from "./rounding-logs";
import { alerts } from "./alerts";

export const roomsRelations = relations(rooms, ({ many }) => ({
  patients: many(patients),
  roundingLogs: many(roundingLogs),
  alerts: many(alerts),
}));