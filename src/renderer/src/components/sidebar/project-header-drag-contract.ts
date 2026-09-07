import type { PointerEvent } from 'react'

import type { ProjectHeaderDragBucketKey, ProjectHeaderDragRect } from './project-header-drop'
import type { Repo } from '../../../../shared/repo-types'

/** '' = the space switcher trigger; a space id = a menu item; null = not over any target. */
export type SpaceDropTargetId = string | '' | null

export type RepoDragState = {
  draggingRepoId: string | null
  dropIndex: number | null
  dropIndicatorY: number | null
  hoverSpaceTargetId: SpaceDropTargetId
}

export const INITIAL_REPO_DRAG_STATE: RepoDragState = {
  draggingRepoId: null,
  dropIndex: null,
  dropIndicatorY: null,
  hoverSpaceTargetId: null
}

export type UseRepoHeaderDragArgs = {
  orderedRepoIds: string[]
  sidebarRepoHeaderIdsByBucket: ReadonlyMap<ProjectHeaderDragBucketKey, readonly string[]>
  repoById: ReadonlyMap<string, Repo>
  usesProjectGroupOrdering: boolean
  onCommitRepoOrder: (orderedIds: string[]) => void
  onCommitProjectGroupOrder: (repoId: string, projectGroupId: string | null, order: number) => void
  getScrollContainer: () => HTMLElement | null
  onDropOnSpace?: (repoId: string, spaceId: string) => void
}

export type RepoHeaderDragController = {
  state: RepoDragState
  onHandlePointerDown: (event: PointerEvent<HTMLElement>, repoId: string) => void
}

export type ProjectHeaderDragSession = {
  repoId: string
  bucketKey: ProjectHeaderDragBucketKey
  sidebarRepoHeaderIds: readonly string[]
  pointerId: number
  headerRects: ProjectHeaderDragRect[]
  handleEl: HTMLElement
  startX: number
  startY: number
  latestPointerY: number
  latestPointerX: number
  promoted: boolean
  externalTargetId: SpaceDropTargetId
}

/** A quiescent drag state: no sidebar reorder in progress, only the space hover (if any). */
export function idleRepoDragState(
  repoId: string,
  hoverSpaceTargetId: SpaceDropTargetId
): RepoDragState {
  return { draggingRepoId: repoId, dropIndex: null, dropIndicatorY: null, hoverSpaceTargetId }
}

export type EndDragOutcome =
  | { kind: 'space'; spaceId: string }
  | { kind: 'reorder'; sidebarDropIndex: number }
  | { kind: 'none' }

export function resolveEndDragOutcome(
  session: ProjectHeaderDragSession,
  commit: boolean,
  latestDropIndex: number | null
): EndDragOutcome {
  if (!commit || !session.promoted) {
    return { kind: 'none' }
  }
  // Why: any external target (including '', the trigger) preempts reorder — only a real space
  // id lands; '' is a no-op rather than falling through to a stale latestDropIndex.
  if (session.externalTargetId !== null) {
    return session.externalTargetId
      ? { kind: 'space', spaceId: session.externalTargetId }
      : { kind: 'none' }
  }
  if (latestDropIndex !== null) {
    return { kind: 'reorder', sidebarDropIndex: latestDropIndex }
  }
  return { kind: 'none' }
}

export const PROJECT_HEADER_DRAG_THRESHOLD_PX = 4

const REPO_HEADER_DRAG_HANDLE_SELECTOR = '[data-repo-header-drag-handle]'

// Shared with project-group headers: both reuse ProjectHeaderActions markup.
export const REPO_HEADER_ACTION_SELECTOR =
  '[data-repo-header-actions], [data-repo-header-action], [data-repo-header-collapse-affordance], button, a, input, textarea, select, [contenteditable=""], [contenteditable="true"]'

export function isProjectHeaderDragHandleTarget(
  target: EventTarget | null,
  currentTarget: HTMLElement
): boolean {
  // Why: the project icon renders as an <svg>, so pressing it makes the event
  // target an SVGElement (not an HTMLElement). Match Element so dragging by the
  // icon still arms the drag; closest/contains work on any Element.
  if (!(target instanceof Element)) {
    return false
  }
  const dragHandle = target.closest(REPO_HEADER_DRAG_HANDLE_SELECTOR)
  return dragHandle !== null && currentTarget.contains(dragHandle)
}

export function isRepoHeaderActionTarget(
  target: EventTarget | null,
  currentTarget: HTMLElement
): boolean {
  // Why: an <svg> icon inside an action button is an SVGElement, so match
  // Element to still treat it as an action target and not arm a drag.
  if (!(target instanceof Element) || target === currentTarget) {
    return false
  }
  return currentTarget.contains(target) && target.closest(REPO_HEADER_ACTION_SELECTOR) !== null
}
