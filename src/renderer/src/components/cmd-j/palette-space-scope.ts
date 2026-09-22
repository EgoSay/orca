/**
 * [INPUT]: 依赖 ./palette-filter 的 PaletteFilterState
 * [OUTPUT]: 对外提供 groupWorktreeItemsByProject、isSpaceScopeFilter、planQueryScopeFilter、planSpaceSeed
 * [POS]: ⌘J 的空间范围：Space 的 repo id 集合就是面板的 repoIds 过滤；判断当前过滤是否等于该范围、决定何时（重新）播种、输入查询时如何放开范围，并把空查询行按项目分块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PaletteFilterState } from './palette-filter'

export function groupWorktreeItemsByProject<T>(
  items: readonly T[],
  getProjectKey: (item: T) => string
): T[] {
  const blocks = new Map<string, T[]>()
  for (const item of items) {
    const key = getProjectKey(item)
    const block = blocks.get(key)
    if (block) {
      block.push(item)
    } else {
      blocks.set(key, [item])
    }
  }
  return [...blocks.values()].flat()
}

// Why: order-insensitive — the seed sorts repoIds, but a stale chip toggle
// could still leave the same set in a different order.
export function isSpaceScopeFilter(
  filter: Pick<PaletteFilterState, 'repoIds'>,
  spaceRepoIds: readonly string[]
): boolean {
  if (filter.repoIds.length === 0 || spaceRepoIds.length === 0) {
    return false
  }
  if (filter.repoIds.length !== spaceRepoIds.length) {
    return false
  }
  const filterIdSet = new Set(filter.repoIds)
  return spaceRepoIds.every((id) => filterIdSet.has(id))
}

/**
 * Spec §6.3.3: typing a query searches every space. The seeded space chip is
 * scope, not a user filter — drop the repository axis while it is exactly the
 * seed. The user's own repository chips (not set-equal to the seed) and every
 * host chip keep filtering. Returns the same reference when nothing changes.
 */
export function planQueryScopeFilter(
  filter: PaletteFilterState,
  spaceRepoIds: readonly string[] | null
): PaletteFilterState {
  return spaceRepoIds && isSpaceScopeFilter(filter, spaceRepoIds)
    ? { hostIds: filter.hostIds, repoIds: [] }
    : filter
}

/**
 * Why: the palette seeds from the sidebar scope on open, but the space's repo
 * set can still be empty then (spaces/repos not hydrated). Making "already
 * seeded this open" and "is the set ready" explicit lets the caller re-run on
 * every change without re-seeding a chip the user cleared.
 */
export function planSpaceSeed(input: {
  activeSpaceId: string | null
  activeSpaceRepoIds: ReadonlySet<string> | undefined
  seededSpaceId: string | null
}): { spaceId: string; repoIds: string[] } | null {
  const { activeSpaceId, activeSpaceRepoIds, seededSpaceId } = input
  if (!activeSpaceId || !activeSpaceRepoIds || seededSpaceId === activeSpaceId) {
    return null
  }
  if (activeSpaceRepoIds.size === 0) {
    // Not hydrated yet (or the space has no live members) — try again later.
    return null
  }
  return { spaceId: activeSpaceId, repoIds: [...activeSpaceRepoIds].sort() }
}
