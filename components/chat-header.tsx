"use client"

import { MonitorIcon } from "lucide-react"
import { useState } from "react"

import { BotDialog, type EditableBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"

type ChatHeaderProps = {
  title: string
  avatar: string
  // Present only for chats that resolve to a bot the user can edit.
  bot?: EditableBot | null
}

function ChatHeader({ title, avatar, bot }: ChatHeaderProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        {bot ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 min-w-0 shrink"
            aria-haspopup="dialog"
            onClick={() => setEditOpen(true)}
          >
            <ChatAvatar seed={avatar} className="size-4" />
            <span className="truncate">{title}</span>
          </Button>
        ) : (
          <>
            <ChatAvatar seed={avatar} className="size-4" />
            <span className="truncate text-sm font-medium">{title}</span>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Open in desktop app"
      >
        <MonitorIcon />
      </Button>
      {bot ? (
        <BotDialog
          key={bot.id}
          bot={bot}
          open={editOpen}
          onOpenChange={setEditOpen}
          showTrigger={false}
        />
      ) : null}
    </header>
  )
}

export { ChatHeader }
