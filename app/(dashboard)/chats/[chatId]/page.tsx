import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { ChatHeader } from "@/components/chat-header"
import { getChat } from "@/queries/chats"

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  await auth.protect()

  const { chatId } = await params
  const chat = await getChat(chatId)

  if (!chat) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        title={chat.title}
        avatar={chat.avatar}
        bot={chat.bot}
      />
    </div>
  )
}
