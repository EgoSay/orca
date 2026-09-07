/**
 * [INPUT]: 依赖 shared/space-membership 的 toSpaceMemberId/buildSetupByRepoId，shared/persisted-state-types 的 PersistedState
 * [OUTPUT]: 对外提供 removeRepoFromSpaces
 * [POS]: tracking-repos 的 Space 成员清理点；repo 离开 state.repos 时由 repo-lifecycle-operations 调用，取代 load 期的全量 prune
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PersistedState } from '../../../shared/persisted-state-types'
import { buildSetupByRepoId, toSpaceMemberId } from '../../../shared/space-membership'

type SpaceMemberRemovalState = Pick<PersistedState, 'repos' | 'projectHostSetups' | 'spaces'>

/**
 * Drop the departing repo's member id from every space. Returns true when a space changed.
 *
 * Only the one departing id is considered: load-time pruning against the whole local repo set
 * would also delete members that live on a runtime host and are never persisted here.
 * Call after the repo has already left `state.repos`.
 */
export function removeRepoFromSpaces(
  state: SpaceMemberRemovalState,
  removedRepoId: string
): boolean {
  const spaces = state.spaces ?? []
  if (spaces.length === 0) {
    return false
  }
  const setupByRepoId = buildSetupByRepoId(state.projectHostSetups ?? [])
  const departingId = toSpaceMemberId(removedRepoId, setupByRepoId)
  // Why: a `project:` id is shared by every host's copy of that project — keep it while one survives.
  const stillOwned = (state.repos ?? []).some(
    (repo) => toSpaceMemberId(repo.id, setupByRepoId) === departingId
  )
  if (stillOwned) {
    return false
  }
  let changed = false
  for (const space of spaces) {
    const memberIds = space.memberIds.filter((id) => id !== departingId)
    if (memberIds.length !== space.memberIds.length) {
      space.memberIds = memberIds
      space.updatedAt = Date.now()
      changed = true
    }
  }
  return changed
}
