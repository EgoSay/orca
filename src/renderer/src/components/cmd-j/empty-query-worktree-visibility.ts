/**
 * [INPUT]: 依赖 shared 的工作区类型与归属谓词、sidebar 的休眠豁免、lib 的活跃状态及 palette-filter
 * [OUTPUT]: 对外提供 buildEmptyQueryWorktreeVisibility
 * [POS]: ⌘J 空查询行的可见性谓词；从 use-worktree-jump-palette-worktrees 抽出，与侧边栏共用同一套隐藏开关
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  isAutomationGeneratedWorkspace,
  isCliCreatedWorkspace,
  isDetachedHeadWorkspace,
  isSleepingSweepExemptWorkspace
} from '@/components/sidebar/visible-worktrees'
import { isDefaultBranchWorkspace } from '../../../../shared/worktree/workspace-kinds'
import { isWorkspaceOwnedBySomeoneElse } from '../../../../shared/workspace-creator-visibility'
import { parseWorkspaceKey } from '../../../../shared/workspace-scope'
import type { Repo } from '../../../../shared/repo-types'
import { isInactiveWorkspace } from '@/lib/worktree-activity-state'
import type { Worktree } from '../../../../shared/worktree/types'
import type { PaletteFilterPredicate } from './palette-filter'

export type EmptyQueryWorktreeVisibilityInput = {
  filterPredicate: PaletteFilterPredicate | null
  repoMap: ReadonlyMap<string, Repo>
  hideDefaultBranchWorkspace: boolean
  hideAutomationGeneratedWorkspaces: boolean
  hideCliCreatedWorkspaces: boolean
  hideDetachedHeadWorkspaces: boolean
  hideWorkspacesFromOtherDevices: boolean
  pairedDeviceIdsByEnvironment: ReadonlyMap<string, string>
  showSleepingWorkspaces: boolean
  alwaysShowDefaultBranchWorkspace: boolean
  tabsByWorktree: Parameters<typeof isInactiveWorkspace>[1]
  ptyIdsByTabId: Parameters<typeof isInactiveWorkspace>[2]
  browserTabsByWorktree: Parameters<typeof isInactiveWorkspace>[3]
  worktreeIdsWithLiveAgent: ReadonlySet<string>
  worktreeIdsWithStructuredChat: ReadonlySet<string>
}

/** The ⌘J empty-query row set: the sidebar's hide switches plus the active palette filter. */
export function buildEmptyQueryWorktreeVisibility(
  input: EmptyQueryWorktreeVisibilityInput
): (worktree: Worktree) => boolean {
  return (worktree) => {
    if (worktree.isArchived) {
      return false
    }
    if (input.filterPredicate && !input.filterPredicate.matchesWorktree(worktree)) {
      return false
    }
    if (
      input.hideWorkspacesFromOtherDevices &&
      isWorkspaceOwnedBySomeoneElse(worktree, input.pairedDeviceIdsByEnvironment)
    ) {
      return false
    }
    if (parseWorkspaceKey(worktree.id)?.type === 'folder') {
      return true
    }
    if (
      input.hideDefaultBranchWorkspace &&
      isDefaultBranchWorkspace(worktree, input.repoMap.get(worktree.repoId))
    ) {
      return false
    }
    if (input.hideAutomationGeneratedWorkspaces && isAutomationGeneratedWorkspace(worktree)) {
      return false
    }
    if (input.hideCliCreatedWorkspaces && isCliCreatedWorkspace(worktree)) {
      return false
    }
    if (input.hideDetachedHeadWorkspaces && isDetachedHeadWorkspace(worktree)) {
      return false
    }
    return (
      input.showSleepingWorkspaces ||
      isSleepingSweepExemptWorkspace(worktree, input.alwaysShowDefaultBranchWorkspace) ||
      !isInactiveWorkspace(
        worktree.id,
        input.tabsByWorktree,
        input.ptyIdsByTabId,
        input.browserTabsByWorktree,
        input.worktreeIdsWithLiveAgent,
        input.worktreeIdsWithStructuredChat
      )
    )
  }
}
