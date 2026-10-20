"use client"

import { useRef } from "react"
import { SidebarRail, useSidebar } from "@/components/ui/sidebar"

// How far the rail must be dragged horizontally before the sidebar toggles.
const DRAG_THRESHOLD = 24

// SidebarRail toggles on click. This adds a drag gesture on top: drag the rail
// left to collapse, right to expand. The click that follows a drag is ignored.
export function SidebarDragRail() {
  const { isMobile, open, setOpen, toggleSidebar } = useSidebar()
  const drag = useRef<{ startX: number; toggled: boolean } | null>(null)
  const suppressClick = useRef(false)

  function finishDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null
    // The click that follows pointerup belongs to this drag, not a new click.
    window.setTimeout(() => {
      suppressClick.current = false
    }, 250)
  }

  return (
    <SidebarRail
      className="touch-none"
      onPointerDown={(event) => {
        if (event.button !== 0 || isMobile) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { startX: event.clientX, toggled: false }
      }}
      onPointerMove={(event) => {
        const dragState = drag.current
        if (!dragState || dragState.toggled) return

        const delta = event.clientX - dragState.startX
        const collapse = open && delta <= -DRAG_THRESHOLD
        const expand = !open && delta >= DRAG_THRESHOLD
        if (!collapse && !expand) return

        dragState.toggled = true
        suppressClick.current = true
        setOpen(!open)
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false
          return
        }
        toggleSidebar()
      }}
    />
  )
}
