import "server-only"

import { auth } from "@clerk/nextjs/server"
import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { bots, chatMembers, chats } from "@/db/schema"

/**
 * A single chat as the chat page renders it. Serialisable so it can cross the
 * server/client boundary into `ChatHeader`.
 */
export type ChatDetail = {
  id: string
  // Direct chats are titled from their bot, group chats from their own name.
  title: string
  // Seed for ChatAvatar. Group chats fall back to their first bot.
  avatar: string
  // The bot shown in the header, editable from the chat page.
  bot: {
    id: string
    name: string
    avatar: string
    job: string
    instructions: string | null
  } | null
}

/**
 * One chat belonging to the signed-in Clerk user. Scoped to `userId` in the
 * query itself, so another user's chat id resolves to `null` rather than a row.
 */
export async function getChat(chatId: string): Promise<ChatDetail | null> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated) {
    return null
  }

  // A chat shows one face, so keep whichever bot joined first. A direct chat
  // has exactly one member; group chats are out of scope for now but still
  // render their first member.
  const [row] = await db
    .select({
      id: chats.id,
      kind: chats.kind,
      name: chats.name,
      botId: bots.id,
      botName: bots.name,
      botAvatar: bots.avatar,
      botJob: bots.job,
      botInstructions: bots.instructions,
    })
    .from(chats)
    .leftJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .leftJoin(bots, eq(bots.id, chatMembers.botId))
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .orderBy(asc(chatMembers.joinedAt))
    .limit(1)

  if (!row) {
    return null
  }

  const title = row.kind === "group" ? (row.name ?? row.botName) : row.botName

  // Every chat gets a title at creation, so a titleless row is broken data
  // rather than a chat we can render.
  if (!title) {
    return null
  }

  return {
    id: row.id,
    title,
    // A chat without a bot still needs a stable face.
    avatar: row.botAvatar ?? row.id,
    bot:
      row.botId && row.botName && row.botAvatar
        ? {
            id: row.botId,
            name: row.botName,
            avatar: row.botAvatar,
            job: row.botJob ?? "",
            instructions: row.botInstructions,
          }
        : null,
  }
}
