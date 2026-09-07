import { useEffect, useMemo } from 'react'
import { buildSidebarHostOptions } from '@/components/sidebar/sidebar-host-options'
import { getProjectGroupExecutionHostIdForRows } from '@/components/sidebar/worktree-list/listing/host-filtering'
import { buildPaletteFilterModel } from '@/components/cmd-j/palette-filter-options'
import {
  buildPaletteFilterPredicate,
  isPaletteFilterActive,
  reconcilePaletteFilter
} from '@/components/cmd-j/palette-filter'
import { spaceToPaletteProjectKeys } from '@/components/cmd-j/palette-space-scope'
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
  | 'visible'
> &
  Pick<WorktreeJumpPaletteLocalState, 'rawFilter' | 'setRawFilter'>

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
  visible,
  rawFilter,
  setRawFilter
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
  const filter = useMemo(
    () => reconcilePaletteFilter(rawFilter, filterModel),
    [rawFilter, filterModel]
  )
  useEffect(() => {
    setRawFilter((current) => reconcilePaletteFilter(current, filterModel))
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- local-state setter identity is stable across extraction.
  }, [filterModel])
  const activeSpaceId = activeSpace?.id ?? null
  // Why: seed on open (or on switching spaces while open) only — the user
  // clearing the space chip mid-session must not be undone by a re-render.
  useEffect(() => {
    if (!visible || !activeSpace) {
      return
    }
    const projectKeys = spaceToPaletteProjectKeys(activeSpace, filterModel).sort()
    // Why: host chips are the user's; only the project field is space-owned.
    setRawFilter((current) => ({ ...current, projectKeys }))
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- open-time seed; filterModel/activeSpace are read, not watched.
  }, [visible, activeSpaceId])
  const spaceScope = useMemo(
    () =>
      activeSpace
        ? {
            name: activeSpace.name,
            projectKeys: spaceToPaletteProjectKeys(activeSpace, filterModel)
          }
        : null,
    [activeSpace, filterModel]
  )
  const filterActive = isPaletteFilterActive(filter)
  const hostFilterActive = filter.hostIds.length > 0
  const filterPredicate = useMemo(
    () => buildPaletteFilterPredicate(filter, filterModel),
    [filter, filterModel]
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
    filter,
    filterActive,
    hostFilterActive,
    filterPredicate,
    groupHostIdByGroupId,
    spaceScope
  }
}

export type WorktreeJumpPaletteFilter = ReturnType<typeof useWorktreeJumpPaletteFilter>
