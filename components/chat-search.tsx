"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import type { SidebarChat } from "@/queries/bots"

type ChatSearchProps = {
  chats: SidebarChat[]
}

export function ChatSearch({ chats }: ChatSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        aria-label="Search chats"
        // The input look, with the button's own hover feedback.
        className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base font-normal text-muted-foreground transition-colors outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-sidebar-foreground group-data-[collapsible=icon]:dark:bg-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
        <span className="flex-1 truncate text-left group-data-[collapsible=icon]:hidden">
          Search
        </span>
        <KbdGroup className="group-data-[collapsible=icon]:hidden">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search chats"
        description="Search your chats by name."
      >
        <Command>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={`${chat.title} ${chat.id}`}
                  onSelect={() => {
                    setOpen(false)
                    router.push(`/chats/${chat.id}`)
                  }}
                >
                  <ChatAvatar seed={chat.avatar} className="size-6" />
                  <span className="truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
