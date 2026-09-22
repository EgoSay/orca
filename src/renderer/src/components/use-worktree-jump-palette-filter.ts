import { useMemo } from 'react'
import { buildSidebarHostOptions } from '@/components/sidebar/sidebar-host-options'
import { getProjectGroupExecutionHostIdForRows } from '@/components/sidebar/worktree-list/listing/host-filtering'
import { buildPaletteFilterModel } from '@/components/cmd-j/palette-filter-options'
import {
  buildPaletteFilterPredicate,
  isPaletteFilterActive
} from '@/components/cmd-j/palette-filter'
import { planQueryScopeFilter } from '@/components/cmd-j/palette-space-scope'
import { getRepoHostIdentity } from '@/store/slices/repo-host-identity'
import { getHostDisplayLabelOverrides } from '../../../shared/host-setting-overrides'
import { getSettingsFocusedExecutionHostId } from '../../../shared/execution-host'
import type { WorktreeJumpPaletteLocalState } from './use-worktree-jump-palette-local-state'
import type { WorktreeJumpPaletteStoreState } from './use-worktree-jump-palette-store-state'

type WorktreeJumpPaletteFilterInput = Pick<
  WorktreeJumpPaletteStoreState,
  | 'repos'
  | 'settings'
  | 'sshTargetLabels'
  | 'sshConnectionStates'
  | 'runtimeEnvironments'
  | 'runtimeStatusByEnvironmentId'
  | 'allWorktrees'
  | 'projects'
  | 'projectHostSetups'
  | 'projectGroups'
  | 'activeSpace'
  | 'activeSpaceRepoIds'
> &
  Pick<WorktreeJumpPaletteLocalState, 'filter'>

export function useWorktreeJumpPaletteFilter({
  repos,
  settings,
  sshTargetLabels,
  sshConnectionStates,
  runtimeEnvironments,
  runtimeStatusByEnvironmentId,
  allWorktrees,
  projects,
  projectHostSetups,
  projectGroups,
  activeSpace,
  activeSpaceRepoIds,
  filter
}: WorktreeJumpPaletteFilterInput) {
  const repoMap = useMemo(() => new Map(repos.map((repo) => [repo.id, repo])), [repos])
  const repoByHostIdentity = useMemo(
    () => new Map(repos.map((repo) => [getRepoHostIdentity(repo), repo])),
    [repos]
  )
  const hostLabelOverrides = useMemo(() => getHostDisplayLabelOverrides(settings), [settings])
  const hostOptions = useMemo(
    () =>
      buildSidebarHostOptions({
        repos,
        sshTargetLabels,
        sshConnectionStates,
        settings,
        runtimeEnvironments,
        runtimeStatusByEnvironmentId,
        hostLabelOverrides
      }),
    [
      repos,
      sshTargetLabels,
      sshConnectionStates,
      settings,
      runtimeEnvironments,
      runtimeStatusByEnvironmentId,
      hostLabelOverrides
    ]
  )
  const canCreateWorktree = repos.length > 0
  const defaultHostId = useMemo(() => getSettingsFocusedExecutionHostId(settings), [settings])
  const filterModel = useMemo(
    () =>
      buildPaletteFilterModel({
        repos,
        worktrees: allWorktrees,
        hostOptions,
        projects,
        projectHostSetups,
        defaultHostId
      }),
    [allWorktrees, defaultHostId, hostOptions, projectHostSetups, projects, repos]
  )
  /** Spec §6.3: the active space as a repository scope; null outside a space or before hydration. */
  const spaceScope = useMemo(
    () =>
      activeSpace && activeSpaceRepoIds
        ? { name: activeSpace.name, repoIds: [...activeSpaceRepoIds].sort() }
        : null,
    [activeSpace, activeSpaceRepoIds]
  )
  const filterActive = isPaletteFilterActive(filter)
  const hostFilterActive = filter.hostIds.length > 0
  const filterPredicate = useMemo(
    () => buildPaletteFilterPredicate(filter, filterModel),
    [filter, filterModel]
  )
  /** Spec §6.3.3: what a typed query is scoped to — same object unless the space seeded it. */
  const queryFilter = useMemo(
    () => planQueryScopeFilter(filter, spaceScope?.repoIds ?? null),
    [filter, spaceScope]
  )
  const queryFilterPredicate = useMemo(
    () =>
      queryFilter === filter
        ? filterPredicate
        : buildPaletteFilterPredicate(queryFilter, filterModel),
    [filter, filterModel, filterPredicate, queryFilter]
  )
  const groupHostIdByGroupId = useMemo(
    () =>
      new Map(
        projectGroups.map((group) => [
          group.id,
          getProjectGroupExecutionHostIdForRows(group, defaultHostId)
        ])
      ),
    [defaultHostId, projectGroups]
  )

  return {
    repoMap,
    repoByHostIdentity,
    hostOptions,
    canCreateWorktree,
    defaultHostId,
    filterModel,
    filterActive,
    hostFilterActive,
    filterPredicate,
    queryFilterPredicate,
    groupHostIdByGroupId,
    spaceScope
  }
}

export type WorktreeJumpPaletteFilter = ReturnType<typeof useWorktreeJumpPaletteFilter>
