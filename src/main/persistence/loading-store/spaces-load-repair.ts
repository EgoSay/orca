/**
 * [INPUT]: 依赖 shared/spaces 的 normalizeSpaces/pruneMissingSpaceMembers/normalizeActiveSpaceId，shared/space-membership 的 toSpaceMemberId/buildSetupByRepoId
 * [OUTPUT]: 对外提供 repairLoadedSpaces
 * [POS]: loading-store 的 Space 加载修复；在 loaded-state-parsing 中紧随 clearMissingProjectGroupMemberships 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PersistedState } from '../../../shared/persisted-state-types'
import type { Space } from '../../../shared/space-types'
import { buildSetupByRepoId, toSpaceMemberId } from '../../../shared/space-membership'
import {
  normalizeActiveSpaceId,
  normalizeSpaces,
  pruneMissingSpaceMembers
} from '../../../shared/spaces'

export function repairLoadedSpaces(
  result: Pick<PersistedState, 'repos' | 'projectHostSetups' | 'spaces' | 'ui'>
): { spaces: readonly Space[]; activeSpaceId: string | null; changed: boolean } {
  const rawSpaces = result.spaces
  const normalized = normalizeSpaces(rawSpaces)
  const setupByRepoId = buildSetupByRepoId(result.projectHostSetups ?? [])
  const validMemberIds = new Set<string>(
    (result.repos ?? []).map((repo) => toSpaceMemberId(repo.id, setupByRepoId))
  )
  const spaces = pruneMissingSpaceMembers(normalized, validMemberIds)
  const activeSpaceId = normalizeActiveSpaceId(result.ui?.activeSpaceId, spaces)
  const changed =
    !Array.isArray(rawSpaces) ||
    rawSpaces.length !== spaces.length ||
    spaces !== normalized ||
    JSON.stringify(rawSpaces) !== JSON.stringify(spaces) ||
    (result.ui?.activeSpaceId ?? null) !== activeSpaceId
  return { spaces, activeSpaceId, changed }
}
