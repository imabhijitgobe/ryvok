"use client"

import { UserButton } from "@clerk/nextjs"
import { PlusIcon, UsersRoundIcon } from "lucide-react"
import { useState } from "react"
import { BotDialog } from "@/components/bot-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Clerk renders its own trigger button, so SidebarMenuButton cannot be used as
// its wrapper: it never forwards className, aria or data props to the DOM. The
// sidebar menu button design is applied through `appearance` instead. Every
// utility is marked important because Clerk applies its compiled element styles
// unlayered, which would otherwise beat Tailwind's layered utilities.
const userButtonAppearance = {
  elements: {
    // The flow root defaults to `width: fit-content`, which makes the trigger
    // hug its contents. Stretch it so the row fills the sidebar menu.
    rootBox: "w-full!",
    // Mirrors SidebarMenuButton: full-width row, menu padding, hover accent.
    // p-1 (4px) + a 1.5rem avatar fills the h-8 row exactly, like a menu icon.
    userButtonTrigger: [
      "flex! h-8! w-full! items-center justify-start! gap-2! overflow-hidden!",
      "rounded-md! border-0! bg-transparent! p-1! text-left! text-sm!",
      "text-sidebar-foreground! hover:bg-sidebar-accent!",
      "hover:text-sidebar-accent-foreground! focus-visible:ring-2!",
      "focus-visible:ring-sidebar-ring! focus-visible:outline-hidden!",
      "group-data-[collapsible=icon]:size-8!",
    ].join(" "),
    // Clerk renders the name first and the avatar last. Reverse the row so the
    // avatar leads and the name follows, packed against the start edge.
    userButtonBox:
      "w-full! min-w-0 flex-row-reverse! items-center justify-end! gap-2!",
    userButtonOuterIdentifier:
      "min-w-0! truncate! ps-0! text-sm! font-medium! text-sidebar-foreground! group-data-[collapsible=icon]:hidden!",
    userButtonAvatarBox: "size-6! shrink-0! rounded-full!",
    userButtonAvatarImage: "rounded-full!",
  },
}

export function AppSidebar() {
  const [botDialogOpen, setBotDialogOpen] = useState(false)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Create something new"
              />
            }
          >
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
              <PlusIcon />
              Create new bot
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UsersRoundIcon />
              Create group chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BotDialog
          open={botDialogOpen}
          onOpenChange={setBotDialogOpen}
          showTrigger={false}
        />
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton showName appearance={userButtonAppearance} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}