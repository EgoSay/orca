/**
 * [INPUT]: 依赖 shared/worktree/types 的 Worktree、shared/worktree/lineage-types 的 WorktreeLineage、
 *   ./worktree-lineage-projection 的 getCyclicProjectedWorktreeLineageIds/getLineageRenderInfo、
 *   shared/worktree/host-qualified-identity 的 getWorktreeHostIdentity
 * [OUTPUT]: 对外提供 addVisibleLineageAncestors
 * [POS]: visible-worktrees 的血缘祖先注入；拆出以保持 visible-worktrees.ts 低于 max-lines（同 sidebar-filter-actions.ts 先例）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Worktree } from '../../../../shared/worktree/types'
import type { WorktreeLineage } from '../../../../shared/worktree/lineage-types'
import {
  getCyclicProjectedWorktreeLineageIds,
  getLineageRenderInfo
} from './worktree-lineage-projection'
import { getWorktreeHostIdentity } from '../../../../shared/worktree/host-qualified-identity'

export function addVisibleLineageAncestors(
  worktrees: Worktree[],
  worktreeById: Map<string, Worktree>,
  lineageById: Record<string, WorktreeLineage>
): Worktree[] {
  const result: Worktree[] = []
  const included = new Set<string>()
  const visiting = new Set<string>()
  const cyclicLineageIds = getCyclicProjectedWorktreeLineageIds(lineageById, worktreeById)

  const addWithAncestors = (worktree: Worktree): void => {
    const identity = getWorktreeHostIdentity(worktree)
    if (included.has(identity) || visiting.has(identity)) {
      return
    }
    visiting.add(identity)
    const lineage = getLineageRenderInfo(worktree, lineageById, worktreeById, cyclicLineageIds)
    if (lineage.state === 'valid') {
      // Why: sidebar lineage is structural. If a filtered child is visible,
      // its valid parent must be rendered too so the hierarchy remains legible.
      addWithAncestors(lineage.parent)
    }
    visiting.delete(identity)
    if (!included.has(identity)) {
      included.add(identity)
      result.push(worktree)
    }
  }

  for (const worktree of worktrees) {
    addWithAncestors(worktree)
  }
  return result
}
