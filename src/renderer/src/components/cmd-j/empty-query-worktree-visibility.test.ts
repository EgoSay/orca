import { describe, expect, it } from 'vitest'
import { folderWorkspaceToWorktree } from '../../../../shared/folder-workspace-worktree'
import { makeFolderWorkspace, makeRepo, makeWorktree } from '../worktree-jump-palette-test-fixtures'
import {
  buildEmptyQueryWorktreeVisibility,
  type EmptyQueryWorktreeVisibilityInput
} from './empty-query-worktree-visibility'

function visibility(overrides: Partial<EmptyQueryWorktreeVisibilityInput> = {}) {
  const repo = makeRepo()
  return buildEmptyQueryWorktreeVisibility({
    filterPredicate: null,
    repoMap: new Map([[repo.id, repo]]),
    hideDefaultBranchWorkspace: true,
    hideAutomationGeneratedWorkspaces: true,
    hideCliCreatedWorkspaces: true,
    hideDetachedHeadWorkspaces: true,
    hideWorkspacesFromOtherDevices: true,
    pairedDeviceIdsByEnvironment: new Map([['server', 'our-device']]),
    showSleepingWorkspaces: false,
    alwaysShowDefaultBranchWorkspace: true,
    tabsByWorktree: {},
    ptyIdsByTabId: {},
    browserTabsByWorktree: {},
    worktreeIdsWithLiveAgent: new Set(),
    worktreeIdsWithStructuredChat: new Set(),
    ...overrides
  })
}

describe('empty-query visibility after upstream integration', () => {
  it('keeps a folder with no terminals despite Git and sleeping filters', () => {
    expect(visibility()(folderWorkspaceToWorktree(makeFolderWorkspace()))).toBe(true)
  })

  it('keeps archived folders hidden', () => {
    expect(visibility()(folderWorkspaceToWorktree(makeFolderWorkspace({ isArchived: true })))).toBe(
      false
    )
  })

  it('applies the active Space or host predicate before the folder exemption', () => {
    const matches = visibility({
      hideDefaultBranchWorkspace: false,
      filterPredicate: {
        matchesWorktree: (worktree) => worktree.repoId === 'repo-1',
        matchesProjectRowKey: () => true,
        matchesGroupHostId: () => true
      }
    })
    expect(matches(folderWorkspaceToWorktree(makeFolderWorkspace()))).toBe(false)
    expect(matches(makeWorktree('active', 'Active', { isMainWorktree: true }))).toBe(true)
  })

  it("keeps another device's folder hidden on a paired host", () => {
    const folder = folderWorkspaceToWorktree(makeFolderWorkspace())
    expect(
      visibility()({
        ...folder,
        runtimeOwnerEnvironmentId: 'server',
        creatorProvenance: { kind: 'paired-device', deviceId: 'other-device' }
      })
    ).toBe(false)
  })

  it('retains the Git sleeping sweep and main-worktree escape hatch', () => {
    const matches = visibility({ hideDefaultBranchWorkspace: false })
    expect(matches(makeWorktree('sleeping', 'Sleeping'))).toBe(false)
    expect(matches(makeWorktree('main', 'Main', { isMainWorktree: true }))).toBe(true)
  })
})
