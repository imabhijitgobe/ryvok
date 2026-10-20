import { cookies } from "next/headers"
import { Suspense } from "react"

import {
  AppSidebarLoader,
  SidebarSkeleton,
} from "@/components/app-sidebar-loader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Written by SidebarProvider on every toggle.
const SIDEBAR_COOKIE_NAME = "sidebar_state"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Suspense fallback={<SidebarSkeleton />}>
        <AppSidebarLoader />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
