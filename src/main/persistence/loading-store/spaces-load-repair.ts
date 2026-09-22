/**
 * [INPUT]: 依赖 shared/spaces 的 normalizeSpaces/normalizeActiveSpaceId
 * [OUTPUT]: 对外提供 repairLoadedSpaces
 * [POS]: loading-store 的 Space 加载修复；在 loaded-state-parsing 中紧随 clearMissingProjectGroupMemberships 调用。悬空成员由 tracking-repos/space-member-removal 在移除时清理，不在此处按本地 repo 集合裁剪
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PersistedState } from '../../../shared/persisted-state-types'
import type { Space } from '../../../shared/space-types'
import { normalizeActiveSpaceId, normalizeSpaces } from '../../../shared/spaces'

/**
 * Field repair only. Members are never pruned against `result.repos`: runtime-host projects are
 * fetched over RPC and never persisted here, so a load-time prune deleted them on every restart.
 * A dangling member id costs nothing — `resolveSpaceRepoIds` simply never matches it.
 */
export function repairLoadedSpaces(result: Pick<PersistedState, 'spaces' | 'ui'>): {
  spaces: readonly Space[]
  activeSpaceId: string | null
  changed: boolean
} {
  const rawSpaces = result.spaces
  const spaces = normalizeSpaces(rawSpaces)
  const activeSpaceId = normalizeActiveSpaceId(result.ui?.activeSpaceId, spaces)
  const changed =
    !Array.isArray(rawSpaces) ||
    rawSpaces.length !== spaces.length ||
    JSON.stringify(rawSpaces) !== JSON.stringify(spaces) ||
    (result.ui?.activeSpaceId ?? null) !== activeSpaceId
  return { spaces, activeSpaceId, changed }
}
