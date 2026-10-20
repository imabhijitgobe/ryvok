"use server";

import { db } from "@/db";
import {
  bots,
  chatMembers,
  chats,
  deleteBotSchema,
  insertBotSchema,
  updateBotSchema,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateBotResult =
  | { status: "success"; id: string; name: string; chatId: string }
  | { status: "error"; errors: Record<string, string[]> };

export async function createBot(
  input: unknown,
): Promise<CreateBotResult> {
  const parsed = insertBotSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return { status: "error", errors: { _root: ["Not signed in."] } };
  }

  const { name, job, instructions, avatar } = parsed.data;

  try {
    // The bot, its direct chat and the membership row are one unit: a
    // half-created bot must never survive, so they commit or roll back
    // together.
    const { id, chatId } = await db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({
          userId,
          name,
          job,
          avatar,
          instructions: instructions?.trim() || null,
        })
        .returning({ id: bots.id });

      // Direct chats stay unnamed — the title comes from the bot's name.
      const [chat] = await tx
        .insert(chats)
        .values({ userId, kind: "direct", name: null })
        .returning({ id: chats.id });

      await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id });

      return { id: bot.id, chatId: chat.id };
    });

    revalidatePath("/");

    return { status: "success", id, name, chatId };
  } catch {
    return {
      status: "error",
      errors: { _root: ["Could not create the bot. Try again."] },
    };
  }
}

export type UpdateBotResult =
  | { status: "success"; id: string; name: string }
  | { status: "error"; errors: Record<string, string[]> };

export async function updateBot(
  input: unknown,
): Promise<UpdateBotResult> {
  const parsed = updateBotSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return { status: "error", errors: { _root: ["Not signed in."] } };
  }

  const { id, name, job, instructions, avatar } = parsed.data;

  try {
    // Ownership lives in the WHERE clause, so another user's bot id updates
    // nothing instead of leaking or mutating a row we do not own.
    const [updated] = await db
      .update(bots)
      .set({
        name,
        job,
        avatar,
        instructions: instructions?.trim() || null,
      })
      .where(and(eq(bots.id, id), eq(bots.userId, userId)))
      .returning({ id: bots.id });

    if (!updated) {
      return {
        status: "error",
        errors: { _root: ["Could not find that bot."] },
      };
    }

    // The sidebar title and the chat header both read the bot row, so refresh
    // the whole layout rather than just the current page.
    revalidatePath("/", "layout");

    return { status: "success", id: updated.id, name };
  } catch {
    return {
      status: "error",
      errors: { _root: ["Could not update the bot. Try again."] },
    };
  }
}

export type DeleteBotResult =
  | { status: "success"; id: string }
  | { status: "error"; errors: Record<string, string[]> };

export async function deleteBot(
  input: unknown,
): Promise<DeleteBotResult> {
  const parsed = deleteBotSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return { status: "error", errors: { _root: ["Not signed in."] } };
  }

  try {
    const deleted = await db.transaction(async (tx) => {
      // Ownership is part of the lookup, so another user's bot id deletes
      // nothing. Do this before touching chats.
      const [owned] = await tx
        .select({ id: bots.id })
        .from(bots)
        .where(and(eq(bots.id, parsed.data.id), eq(bots.userId, userId)))
        .limit(1);

      if (!owned) {
        return null;
      }

      // A direct chat exists only for its bot, so it goes with it. Group chats
      // keep their other members and are left alone.
      const directChats = await tx
        .select({ id: chatMembers.chatId })
        .from(chatMembers)
        .innerJoin(chats, eq(chats.id, chatMembers.chatId))
        .where(
          and(
            eq(chatMembers.botId, owned.id),
            eq(chats.userId, userId),
            eq(chats.kind, "direct"),
          ),
        );

      if (directChats.length > 0) {
        await tx.delete(chats).where(
          inArray(
            chats.id,
            directChats.map((chat) => chat.id),
          ),
        );
      }

      // chat_members rows cascade with the bot.
      await tx.delete(bots).where(eq(bots.id, owned.id));

      return owned.id;
    });

    if (!deleted) {
      return {
        status: "error",
        errors: { _root: ["Could not find that bot."] },
      };
    }

    revalidatePath("/", "layout");

    return { status: "success", id: deleted };
  } catch {
    return {
      status: "error",
      errors: { _root: ["Could not delete the bot. Try again."] },
    };
  }
}