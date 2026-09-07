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
  if (best) {
    return best
  }
  // Why: never visited any member — land on the main worktree of the project
  // whose work is freshest, not whichever repo happens to sort first.
  const mains = candidates.filter((w) => w.isMainWorktree)
  return pickNewest(mains) ?? pickNewest(candidates) ?? candidates[0]
}

function pickNewest(worktrees: readonly Worktree[]): Worktree | null {
  let best: Worktree | null = null
  for (const worktree of worktrees) {
    if (!best || worktree.lastActivityAt > best.lastActivityAt) {
      best = worktree
    }
  }
  return best
}
