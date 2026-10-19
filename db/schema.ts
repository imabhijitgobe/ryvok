import { createInsertSchema } from "drizzle-zod";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { z } from "zod";

export const bots = pgTable(
  "bots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    job: text("job").notNull(),
    instructions: text("instructions"),
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)],
);

export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;

/**
 * Validates everything the client is allowed to send when creating a bot.
 * `id`, `userId` and `sandboxId` are derived server side, `createdAt` is a
 * database default.
 */
export const insertBotSchema = createInsertSchema(bots, {
  name: (schema) => schema.min(1, "Give your bot a name.").max(80),
  job: (schema) => schema.min(1, "Tell your bot what it does.").max(80),
})
  .omit({
    id: true,
    userId: true,
    sandboxId: true,
    createdAt: true,
  })
  .extend({
    // The textarea submits "" rather than null, so allow an empty string.
    instructions: z
      .string()
      .max(2000, "Keep it under 2000 characters.")
      .optional(),
  });

export type InsertBot = z.infer<typeof insertBotSchema>;