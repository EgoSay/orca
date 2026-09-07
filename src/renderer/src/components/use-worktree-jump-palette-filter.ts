import { useEffect, useMemo, useRef } from 'react'
import { buildSidebarHostOptions } from '@/components/sidebar/sidebar-host-options'
import { getProjectGroupExecutionHostIdForRows } from '@/components/sidebar/worktree-list/listing/host-filtering'
import { buildPaletteFilterModel } from '@/components/cmd-j/palette-filter-options'
import {
  buildPaletteFilterPredicate,
  isPaletteFilterActive,
  reconcilePaletteFilter
} from '@/components/cmd-j/palette-filter'
import { planSpaceSeed, spaceToPaletteProjectKeys } from '@/components/cmd-j/palette-space-scope'
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
  // Why: a ref (not just [visible, activeSpaceId] deps) so a re-render after
  // hydration — repos/projects loading in after the palette is already open —
  // can still seed once; the ref is what actually remembers "already seeded
  // this open," not the effect's dependency list.
  const seededSpaceIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!visible) {
      seededSpaceIdRef.current = null
      return
    }
    const seed = planSpaceSeed({
      activeSpace,
      model: filterModel,
      seededSpaceId: seededSpaceIdRef.current
    })
    if (!seed) {
      return
    }
    seededSpaceIdRef.current = seed.spaceId
    // Why: host chips are the user's; only the project field is space-owned.
    setRawFilter((current) => ({ ...current, projectKeys: seed.projectKeys }))
  }, [visible, activeSpace, filterModel, setRawFilter])
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
