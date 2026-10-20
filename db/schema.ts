import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
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

/**
 * Everything the client may change on an existing bot. Same fields as
 * `insertBotSchema`, plus the id the update is scoped to. Ownership is still
 * checked against the Clerk user in the action.
 */
export const updateBotSchema = insertBotSchema.extend({
  id: z.string().min(1, "Missing bot id."),
});

export type UpdateBot = z.infer<typeof updateBotSchema>;

/** Deleting only needs the id; ownership is checked in the action. */
export const deleteBotSchema = updateBotSchema.pick({ id: true });

export type DeleteBot = z.infer<typeof deleteBotSchema>;

export const chatKind = pgEnum("chat_kind", ["direct", "group"]);

export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    // Clerk user id, not a foreign key — Clerk owns this table.
    userId: text("user_id").notNull(),
    kind: chatKind("kind").notNull().default("direct"),
    // Direct chats are titled from the bot's name, so name stays null.
    name: text("name"),
    lastMessagePreview: text("last_message_preview"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("chats_user_id_idx").on(table.userId)],
);

export const chatMembers = pgTable(
  "chat_members",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    botId: text("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.botId] }),
    // chat_id is already covered by the composite primary key.
    index("chat_members_bot_id_idx").on(table.botId),
  ],
);

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatMember = typeof chatMembers.$inferSelect;
export type NewChatMember = typeof chatMembers.$inferInsert;

export const botsRelations = relations(bots, ({ many }) => ({
  memberships: many(chatMembers),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMembers.chatId],
    references: [chats.id],
  }),
  bot: one(bots, {
    fields: [chatMembers.botId],
    references: [bots.id],
  }),
}));