"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import {
  chat,
  defaultStorage,
  type ChatLoadTranscriptParams,
  type ChatStartSessionParams,
} from "@trigger.dev/sdk/ai"
import { and, eq } from "drizzle-orm"

import type { chatAgent } from "@/Trigger/chat"
import { db } from "@/db"
import { chats } from "@/db/schema"

const startSession = chat.createStartSessionAction<typeof chatAgent>("chat")

// The platform transcript storage keys messages by chatId. This action reads
// that transcript, so authentication and ownership still happen here.
const loadTranscript = chat.createLoadTranscriptAction(defaultStorage, {
  limit: 50,
})

/**
 * `chatId` arrives from the browser, so every chat action proves the signed-in
 * Clerk user owns the row before it touches Trigger.dev.
 */
async function assertChatOwner(chatId: string) {
  const { userId } = await clerkAuth()

  if (!userId) {
    throw new Error("Not signed in.")
  }

  const [owned] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (!owned) {
    throw new Error("Chat not found.")
  }
}

export async function startChatSession(
  params: ChatStartSessionParams<typeof chatAgent>
) {
  await assertChatOwner(params.chatId)

  return startSession(params)
}

export async function mintChatAccessToken(chatId: string) {
  await assertChatOwner(chatId)

  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  })
}

export async function loadChatTranscript(params: ChatLoadTranscriptParams) {
  await assertChatOwner(params.chatId)

  return loadTranscript(params)
}
