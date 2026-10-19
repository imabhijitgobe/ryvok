"use server";

import { db } from "@/db";
import { bots, insertBotSchema } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type CreateBotResult =
  | { status: "success"; id: string; name: string }
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

  const [bot] = await db
    .insert(bots)
    .values({
      userId,
      name,
      job,
      avatar,
      instructions: instructions?.trim() || null,
    })
    .returning({ id: bots.id });

  revalidatePath("/");

  return { status: "success", id: bot.id, name };
}