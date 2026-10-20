import { Skeleton } from "@/components/ui/skeleton"

// Shown while the chat route renders on the server, so a click paints the
// screen shape immediately instead of leaving the previous page frozen.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-1 flex-col gap-8 px-6 py-4 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="shrink-0 px-6 py-4 md:px-10">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}
