import { cookies } from "next/headers"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserChats } from "@/queries/bots"

// Written by SidebarProvider on every toggle.
const SIDEBAR_COOKIE_NAME = "sidebar_state"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [chats, cookieStore] = await Promise.all([getUserChats(), cookies()])
  const defaultOpen =
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar chats={chats} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
