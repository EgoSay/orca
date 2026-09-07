import { useCallback, useEffect, useRef, useState } from 'react'

import {
  computeProjectHeaderDropPreview,
  measureProjectHeaderDragRects
} from './project-header-drop'
import { commitProjectHeaderDragDrop } from './project-header-drag-commit'
import {
  idleRepoDragState,
  INITIAL_REPO_DRAG_STATE,
  PROJECT_HEADER_DRAG_THRESHOLD_PX,
  resolveEndDragOutcome,
  type ProjectHeaderDragSession,
  type RepoDragState,
  type RepoHeaderDragController,
  type SpaceDropTargetId,
  type UseRepoHeaderDragArgs
} from './project-header-drag-contract'
import { createProjectHeaderDragSession } from './project-header-drag-start'
import { useRepoHeaderDragAutoscroll } from './project-header-drag-autoscroll'
import { hasPointerBeenReleased } from './header-drag-pointer-release'
import { swallowNextClickOnDragHandle } from './header-drag-click-swallow'
import { findSpaceDropTarget } from './spaces/space-drop-target'

// Why pointer events instead of HTML5 DnD: rows are absolutely-positioned by
// react-virtual and unmount/remount as scroll changes, so DnD enter/leave fire
// against stale targets. With pointer events we cache the active set of repo
// header positions and compute the drop index from the live pointer Y.

export function useRepoHeaderDrag({
  orderedRepoIds,
  sidebarRepoHeaderIdsByBucket,
  repoById,
  usesProjectGroupOrdering,
  onCommitRepoOrder,
  onCommitProjectGroupOrder,
  getScrollContainer,
  onDropOnSpace
}: UseRepoHeaderDragArgs): RepoHeaderDragController {
  const [state, setState] = useState<RepoDragState>(INITIAL_REPO_DRAG_STATE)
  const [sessionArmed, setSessionArmed] = useState(false)
  const latestDropIndexRef = useRef<number | null>(null)
  latestDropIndexRef.current = state.dropIndex
  const orderedIdsRef = useRef(orderedRepoIds)
  orderedIdsRef.current = orderedRepoIds
  const sidebarRepoHeaderIdsByBucketRef = useRef(sidebarRepoHeaderIdsByBucket)
  sidebarRepoHeaderIdsByBucketRef.current = sidebarRepoHeaderIdsByBucket
  const repoByIdRef = useRef(repoById)
  repoByIdRef.current = repoById
  const usesProjectGroupOrderingRef = useRef(usesProjectGroupOrdering)
  usesProjectGroupOrderingRef.current = usesProjectGroupOrdering
  const onCommitRepoOrderRef = useRef(onCommitRepoOrder)
  onCommitRepoOrderRef.current = onCommitRepoOrder
  const onCommitProjectGroupOrderRef = useRef(onCommitProjectGroupOrder)
  onCommitProjectGroupOrderRef.current = onCommitProjectGroupOrder
  const onDropOnSpaceRef = useRef(onDropOnSpace)
  onDropOnSpaceRef.current = onDropOnSpace
  const getContainerRef = useRef(getScrollContainer)
  getContainerRef.current = getScrollContainer

  const dragSessionRef = useRef<ProjectHeaderDragSession | null>(null)
  const clickSwallowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshHeaderRects = useCallback(() => {
    const container = getContainerRef.current()
    const session = dragSessionRef.current
    if (!container || !session) {
      return []
    }
    const rects = measureProjectHeaderDragRects(container, session.bucketKey)
    session.headerRects = rects
    return rects
  }, [])

  const computeDrop = useCallback(
    (pointerY: number): { dropIndex: number; dropIndicatorY: number } | null => {
      const session = dragSessionRef.current
      const container = getContainerRef.current()
      if (!session || !container) {
        return null
      }
      return computeProjectHeaderDropPreview({
        pointerY,
        containerTop: container.getBoundingClientRect().top,
        scrollTop: container.scrollTop,
        rects: session.headerRects,
        sidebarRepoHeaderIds: session.sidebarRepoHeaderIds,
        contentBottom: container.scrollHeight
      })
    },
    []
  )

  const applyDrop = useCallback(
    (
      repoId: string,
      drop: { dropIndex: number; dropIndicatorY: number } | null,
      hoverSpaceTargetId: SpaceDropTargetId = null
    ) => {
      latestDropIndexRef.current = drop?.dropIndex ?? null
      const nextState: RepoDragState = drop
        ? { draggingRepoId: repoId, hoverSpaceTargetId, ...drop }
        : idleRepoDragState(repoId, hoverSpaceTargetId)
      setState((prev) =>
        prev.draggingRepoId === nextState.draggingRepoId &&
        prev.dropIndex === nextState.dropIndex &&
        prev.dropIndicatorY === nextState.dropIndicatorY &&
        prev.hoverSpaceTargetId === nextState.hoverSpaceTargetId
          ? prev
          : nextState
      )
    },
    []
  )

  const { ensureAutoscroll, cancelAutoscroll } = useRepoHeaderDragAutoscroll({
    dragSessionRef,
    getContainerRef,
    refreshHeaderRects,
    applyDrop,
    computeDrop
  })

  const endDrag = useCallback(
    (commit: boolean) => {
      cancelAutoscroll()
      const session = dragSessionRef.current
      if (!session) {
        setState(INITIAL_REPO_DRAG_STATE)
        setSessionArmed(false)
        return
      }
      try {
        session.handleEl.releasePointerCapture(session.pointerId)
      } catch {
        // capture may already be released (pointercancel, element unmounted)
      }
      if (session.promoted) {
        clickSwallowTimeoutRef.current = swallowNextClickOnDragHandle(session.handleEl)
      }
      const outcome = resolveEndDragOutcome(session, commit, latestDropIndexRef.current)
      dragSessionRef.current = null
      setState(INITIAL_REPO_DRAG_STATE)
      setSessionArmed(false)
      if (outcome.kind === 'reorder') {
        commitProjectHeaderDragDrop({
          session,
          sidebarDropIndex: outcome.sidebarDropIndex,
          orderedRepoIds: orderedIdsRef.current,
          repoById: repoByIdRef.current,
          usesProjectGroupOrdering: usesProjectGroupOrderingRef.current,
          onCommitRepoOrder: onCommitRepoOrderRef.current,
          onCommitProjectGroupOrder: onCommitProjectGroupOrderRef.current
        })
        return
      }
      if (outcome.kind === 'space') {
        onDropOnSpaceRef.current?.(session.repoId, outcome.spaceId)
      }
    },
    [cancelAutoscroll]
  )

  useEffect(() => {
    if (!sessionArmed) {
      return
    }
    const onPointerMove = (e: PointerEvent): void => {
      const session = dragSessionRef.current
      if (!session || e.pointerId !== session.pointerId) {
        return
      }
      if (hasPointerBeenReleased(e)) {
        endDrag(false)
        return
      }
      session.latestPointerY = e.clientY
      session.latestPointerX = e.clientX
      if (!session.promoted) {
        const dx = e.clientX - session.startX
        const dy = e.clientY - session.startY
        if (
          dx * dx + dy * dy <
          PROJECT_HEADER_DRAG_THRESHOLD_PX * PROJECT_HEADER_DRAG_THRESHOLD_PX
        ) {
          return
        }
        session.promoted = true
        // Why: setPointerCapture can throw if the element is detached. Check
        // isConnected first to avoid the throw; the global pointer listeners
        // still fire, so dragging keeps working even if capture fails.
        if (session.handleEl.isConnected) {
          try {
            session.handleEl.setPointerCapture(session.pointerId)
          } catch {
            // Ignore capture failure; global listeners will handle the drag.
          }
        }
      }
      // Why: session.promoted is always true here — the branch above returns early otherwise.
      // The tail below (applyDrop or the space branch) sets draggingRepoId, so no interim setState.
      refreshHeaderRects()
      session.externalTargetId = findSpaceDropTarget(document, e.clientX, e.clientY)
      if (session.externalTargetId !== null) {
        // Why: over the toolbar the reorder indicator and autoscroll both go quiet — geometric
        // intent. Routed through applyDrop so its equality gate skips the setState when the
        // hovered target hasn't changed since the last pointermove (a stationary hover is common).
        applyDrop(session.repoId, null, session.externalTargetId)
        cancelAutoscroll()
        return
      }
      applyDrop(session.repoId, computeDrop(e.clientY))
      ensureAutoscroll()
    }
    const onPointerUp = (e: PointerEvent): void => {
      const session = dragSessionRef.current
      if (!session || e.pointerId !== session.pointerId) {
        return
      }
      endDrag(true)
    }
    const onPointerCancel = (e: PointerEvent): void => {
      const session = dragSessionRef.current
      if (!session || e.pointerId !== session.pointerId) {
        return
      }
      endDrag(false)
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        endDrag(false)
      }
    }
    const onBlur = (): void => endDrag(false)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onBlur)
      cancelAutoscroll()
      if (clickSwallowTimeoutRef.current !== null) {
        clearTimeout(clickSwallowTimeoutRef.current)
        clickSwallowTimeoutRef.current = null
      }
    }
  }, [
    applyDrop,
    cancelAutoscroll,
    computeDrop,
    endDrag,
    ensureAutoscroll,
    refreshHeaderRects,
    sessionArmed
  ])

  useEffect(() => {
    if (state.draggingRepoId === null) {
      return
    }
    const body = document.body
    const prevCursor = body.style.cursor
    const prevUserSelect = body.style.userSelect
    body.style.cursor = 'grabbing'
    body.style.userSelect = 'none'
    return () => {
      body.style.cursor = prevCursor
      body.style.userSelect = prevUserSelect
    }
  }, [state.draggingRepoId])

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>, repoId: string) => {
      const session = createProjectHeaderDragSession({
        event,
        repoId,
        repoById: repoByIdRef.current,
        sidebarRepoHeaderIdsByBucket: sidebarRepoHeaderIdsByBucketRef.current,
        getScrollContainer: getContainerRef.current
      })
      if (!session) {
        return
      }
      dragSessionRef.current = session
      setSessionArmed(true)
    },
    []
  )

  return { state, onHandlePointerDown }
}

export {
  isRepoHeaderActionTarget,
  isProjectHeaderDragHandleTarget
} from './project-header-drag-contract'
