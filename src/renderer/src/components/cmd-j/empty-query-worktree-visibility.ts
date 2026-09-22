/**
 * [INPUT]: 依赖 sidebar/visible-worktrees、sidebar/default-branch-workspace、sidebar/workspace-creator-visibility 的可见性谓词，lib/worktree-activity-state 的 isInactiveWorkspace，./palette-filter 的 PaletteFilterPredicate
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
import { isDefaultBranchWorkspace } from '@/components/sidebar/default-branch-workspace'
import { isWorkspaceFromOtherDevice } from '@/components/sidebar/workspace-creator-visibility'
import { isInactiveWorkspace } from '@/lib/worktree-activity-state'
import type { Worktree } from '../../../../shared/worktree/types'
import type { PaletteFilterPredicate } from './palette-filter'

export type EmptyQueryWorktreeVisibilityInput = {
  filterPredicate: PaletteFilterPredicate | null
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
    if (input.hideDefaultBranchWorkspace && isDefaultBranchWorkspace(worktree)) {
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
    if (
      input.hideWorkspacesFromOtherDevices &&
      isWorkspaceFromOtherDevice(worktree, input.pairedDeviceIdsByEnvironment)
    ) {
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
