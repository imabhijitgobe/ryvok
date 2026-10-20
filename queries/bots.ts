import "server-only"

import { auth } from "@clerk/nextjs/server"
import { asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { bots, chatMembers, chats } from "@/db/schema"

/**
 * A chat as the sidebar renders it. Serialisable so it can cross the
 * server/client boundary into `AppSidebar`.
 */
export type SidebarChat = {
  id: string
  // Direct chats are titled from their bot, group chats from their own name.
  title: string
  // Seed for ChatAvatar. Group chats fall back to their first bot.
  avatar: string
  lastMessagePreview: string | null
  lastMessageAt: Date
}

/**
 * Every chat belonging to the signed-in Clerk user, newest activity first.
 * Scoped to `userId` in the query itself, never a client-supplied id.
 */
export async function getUserChats(): Promise<SidebarChat[]> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated) {
    return []
  }

  const rows = await db
    .select({
      id: chats.id,
      kind: chats.kind,
      name: chats.name,
      lastMessagePreview: chats.lastMessagePreview,
      lastMessageAt: chats.lastMessageAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.lastMessageAt))

  if (rows.length === 0) {
    return []
  }

  // Group chats have several bots but the sidebar shows one face, so keep
  // whichever bot joined first. A direct chat has exactly one member.
  const members = await db
    .select({
      chatId: chatMembers.chatId,
      name: bots.name,
      avatar: bots.avatar,
    })
    .from(chatMembers)
    .innerJoin(bots, eq(chatMembers.botId, bots.id))
    .where(
      inArray(
        chatMembers.chatId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(chatMembers.joinedAt))

  const firstBot = new Map<string, { name: string; avatar: string }>()

  for (const member of members) {
    if (firstBot.has(member.chatId)) {
      continue
    }

    firstBot.set(member.chatId, { name: member.name, avatar: member.avatar })
  }

  return rows.flatMap((row) => {
    const bot = firstBot.get(row.id)
    const title = row.kind === "group" ? (row.name ?? bot?.name) : bot?.name

    // Every chat gets a title at creation, so a titleless row is broken data
    // rather than a chat we can render.
    if (!title) {
      return []
    }

    return [
      {
        id: row.id,
        title,
        // A chat without a bot still needs a stable face.
        avatar: bot?.avatar ?? row.id,
        lastMessagePreview: row.lastMessagePreview,
        lastMessageAt: row.lastMessageAt,
      },
    ]
  })
}
