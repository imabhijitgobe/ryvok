import { AppSidebar } from "@/components/app-sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserChats } from "@/queries/bots"

// The sidebar query lives behind its own Suspense boundary so a page never
// waits on the chat list before it can render.
async function AppSidebarLoader() {
  const chats = await getUserChats()

  return <AppSidebar chats={chats} />
}

function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex justify-end group-data-[collapsible=icon]:justify-center">
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="gap-1">
          {Array.from({ length: 6 }, (_, index) => (
            <SidebarMenuItem key={index}>
              <Skeleton className="h-[3.25rem] w-full rounded-md" />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Skeleton className="h-8 w-full rounded-md" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export { AppSidebarLoader, SidebarSkeleton }
