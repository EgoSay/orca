/**
 * [INPUT]: 依赖 DOM 的 data-space-drop-target 属性，../project-header-drag-contract 的 SpaceDropTargetId
 * [OUTPUT]: 对外提供 findSpaceDropTarget、SPACE_DROP_TARGET_ATTR、SPACE_SWITCHER_DROP_TARGET
 * [POS]: 项目表头指针拖拽的外部落点判别；被 project-header-drag 每次 pointermove 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { SpaceDropTargetId } from '../project-header-drag-contract'

export const SPACE_DROP_TARGET_ATTR = 'data-space-drop-target'

// Why empty: the switcher trigger carries the bare attribute, so the DOM hands
// back '' for it and any non-empty value is a real space id — one read, no branch.
export const SPACE_SWITCHER_DROP_TARGET = '' as const

/** SPACE_SWITCHER_DROP_TARGET = the trigger; a space id = a menu item; null = not over any target. */
export function findSpaceDropTarget(root: ParentNode, x: number, y: number): SpaceDropTargetId {
  const nodes = root.querySelectorAll<HTMLElement>(`[${SPACE_DROP_TARGET_ATTR}]`)
  for (const node of nodes) {
    const r = node.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return node.getAttribute(SPACE_DROP_TARGET_ATTR) ?? null
    }
  }
  return null
}
