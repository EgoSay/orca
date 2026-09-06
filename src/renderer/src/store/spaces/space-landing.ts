/**
 * [INPUT]: 依赖 @/lib/worktree-visit-recency 的 getWorktreeVisitTimestamp，shared/worktree/types 的 Worktree
 * [OUTPUT]: 对外提供 pickSpaceLandingWorktree
 * [POS]: 切换 Space 时活动工作区的落点选择纯函数；被 slices/spaces 的 activateSpace 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Worktree } from '../../../../shared/worktree/types'
import { getWorktreeVisitTimestamp } from '@/lib/worktree-visit-recency'

// Why: recency first, then a main worktree — never a random task branch.
export function pickSpaceLandingWorktree(args: {
  worktrees: readonly Worktree[]
  memberRepoIds: ReadonlySet<string>
  lastVisitedAtByWorktreeId: Readonly<Record<string, number>> | undefined
}): Worktree | null {
  const candidates = args.worktrees.filter((w) => !w.isArchived && args.memberRepoIds.has(w.repoId))
  if (candidates.length === 0) {
    return null
  }
  let best: Worktree | null = null
  let bestSeen = 0
  for (const worktree of candidates) {
    const seen = getWorktreeVisitTimestamp(args.lastVisitedAtByWorktreeId, worktree) ?? 0
    if (seen > bestSeen) {
      best = worktree
      bestSeen = seen
    }
  }
  return best ?? candidates.find((w) => w.isMainWorktree) ?? candidates[0]
}
