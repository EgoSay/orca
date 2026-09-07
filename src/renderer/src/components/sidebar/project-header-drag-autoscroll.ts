import { useCallback, useRef } from 'react'
import type { MutableRefObject } from 'react'

import { getWorktreeSidebarDragAutoscroll } from './worktree-sidebar-drag-autoscroll'
import type { ProjectHeaderDragSession } from './project-header-drag-contract'

// Why its own file: the RAF autoscroll loop is a self-contained concern, and keeping it out of
// project-header-drag.ts leaves room there for the drag/session/hit-test orchestration it owns.
export function useRepoHeaderDragAutoscroll(args: {
  dragSessionRef: MutableRefObject<ProjectHeaderDragSession | null>
  getContainerRef: MutableRefObject<() => HTMLElement | null>
  refreshHeaderRects: () => void
  applyDrop: (repoId: string, drop: { dropIndex: number; dropIndicatorY: number } | null) => void
  computeDrop: (pointerY: number) => { dropIndex: number; dropIndicatorY: number } | null
}): { ensureAutoscroll: () => void; cancelAutoscroll: () => void } {
  const { dragSessionRef, getContainerRef, refreshHeaderRects, applyDrop, computeDrop } = args
  const autoscrollLastFrameTimeRef = useRef<number | null>(null)
  const autoscrollFrameIdRef = useRef<number | null>(null)

  const cancelAutoscroll = useCallback(() => {
    if (autoscrollFrameIdRef.current !== null) {
      window.cancelAnimationFrame(autoscrollFrameIdRef.current)
      autoscrollFrameIdRef.current = null
    }
    autoscrollLastFrameTimeRef.current = null
  }, [])

  const runAutoscrollFrame = useCallback(
    (frameTime: number) => {
      autoscrollFrameIdRef.current = null
      const session = dragSessionRef.current
      const container = getContainerRef.current()
      if (!session?.promoted || !container) {
        cancelAutoscroll()
        return
      }

      const previousFrameTime = autoscrollLastFrameTimeRef.current ?? frameTime
      autoscrollLastFrameTimeRef.current = frameTime
      const autoscroll = getWorktreeSidebarDragAutoscroll({
        point: { clientX: 0, clientY: session.latestPointerY },
        containerRect: container.getBoundingClientRect(),
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        elapsedMs: frameTime - previousFrameTime
      })
      if (autoscroll) {
        container.scrollTop = autoscroll.scrollTop
        refreshHeaderRects()
      }

      applyDrop(session.repoId, computeDrop(session.latestPointerY))

      autoscrollFrameIdRef.current = window.requestAnimationFrame(runAutoscrollFrame)
    },
    [applyDrop, cancelAutoscroll, computeDrop, dragSessionRef, getContainerRef, refreshHeaderRects]
  )

  const ensureAutoscroll = useCallback(() => {
    if (autoscrollFrameIdRef.current !== null) {
      return
    }
    autoscrollLastFrameTimeRef.current = null
    autoscrollFrameIdRef.current = window.requestAnimationFrame(runAutoscrollFrame)
  }, [runAutoscrollFrame])

  return { ensureAutoscroll, cancelAutoscroll }
}
