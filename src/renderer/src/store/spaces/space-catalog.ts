/**
 * [INPUT]: 依赖 shared/space-membership 的 resolveSpaceRepoIds/buildSetupByRepoId/toSpaceMemberId，store 的 AppState
 * [OUTPUT]: 对外提供 selectActiveSpace、selectActiveSpaceRepoIds、selectSetupByRepoId、selectSpaceMemberIdForRepo、selectSpacesContainingRepo
 * [POS]: Space 的只读派生层；所有可见性/UI 只通过这里读取成员集合
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { AppState } from '../types'
import type { ProjectHostSetup } from '../../../../shared/project-types'
import type { Space, SpaceMemberId } from '../../../../shared/space-types'
import {
  buildSetupByRepoId,
  resolveSpaceRepoIds,
  toSpaceMemberId
} from '../../../../shared/space-membership'

type SpaceCatalogState = Pick<AppState, 'spaces' | 'activeSpaceId' | 'repos' | 'projectHostSetups'>

export function selectActiveSpace(
  state: Pick<SpaceCatalogState, 'spaces' | 'activeSpaceId'>
): Space | null {
  return state.activeSpaceId
    ? (state.spaces.find((s) => s.id === state.activeSpaceId) ?? null)
    : null
}

let setupByRepoIdCache: {
  setups: readonly ProjectHostSetup[]
  value: ReadonlyMap<string, ProjectHostSetup>
} | null = null

// Why: module-level cache assumes a single store instance (true for the renderer's useAppStore).
export function selectSetupByRepoId(
  state: Pick<SpaceCatalogState, 'projectHostSetups'>
): ReadonlyMap<string, ProjectHostSetup> {
  if (setupByRepoIdCache?.setups === state.projectHostSetups) {
    return setupByRepoIdCache.value
  }
  const value = buildSetupByRepoId(state.projectHostSetups)
  setupByRepoIdCache = { setups: state.projectHostSetups, value }
  return value
}

let repoIdsCache: {
  space: Space
  repos: unknown
  setups: unknown
  value: ReadonlySet<string>
} | null = null

/** undefined ≡「全部」— callers skip the filter entirely. Memoized on input identity. */
export function selectActiveSpaceRepoIds(
  state: SpaceCatalogState
): ReadonlySet<string> | undefined {
  const space = selectActiveSpace(state)
  if (!space) {
    return undefined
  }
  if (
    repoIdsCache &&
    repoIdsCache.space === space &&
    repoIdsCache.repos === state.repos &&
    repoIdsCache.setups === state.projectHostSetups
  ) {
    return repoIdsCache.value
  }
  const value = resolveSpaceRepoIds(space, state.repos, selectSetupByRepoId(state))
  repoIdsCache = { space, repos: state.repos, setups: state.projectHostSetups, value }
  return value
}

export function selectSpaceMemberIdForRepo(
  state: Pick<SpaceCatalogState, 'projectHostSetups'>,
  repoId: string
): SpaceMemberId {
  return toSpaceMemberId(repoId, selectSetupByRepoId(state))
}

export function selectSpacesContainingRepo(state: SpaceCatalogState, repoId: string): Space[] {
  const memberId = selectSpaceMemberIdForRepo(state, repoId)
  return state.spaces.filter((space) => space.memberIds.includes(memberId))
}
