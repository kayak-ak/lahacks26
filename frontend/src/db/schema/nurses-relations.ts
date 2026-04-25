import { relations } from "drizzle-orm";
import { nurses } from "./nurses";
import { nurseStatuses } from "./nurse-statuses";

export const nursesRelations = relations(nurses, ({ one }) => ({
  status: one(nurseStatuses, {
    fields: [nurses.id],
    references: [nurseStatuses.nurseId],
  }),
}));