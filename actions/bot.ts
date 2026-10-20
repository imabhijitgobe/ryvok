"use server";

import { db } from "@/db";
import { bots, chatMembers, chats, insertBotSchema } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
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