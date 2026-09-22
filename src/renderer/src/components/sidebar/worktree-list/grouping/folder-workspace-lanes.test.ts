import { describe, expect, it } from 'vitest'
import { getRenderableFolderWorkspaces } from './folder-workspace-lanes'

const groups = [
  { id: 'g-root', name: 'root', parentPath: '/w', parentGroupId: null },
  { id: 'g-child', name: 'child', parentPath: '/w/c', parentGroupId: 'g-root' }
] as never
const fw = { id: 'fw1', projectGroupId: 'g-root', name: 'x' } as never
const repos = [
  { id: 'r-child', projectGroupId: 'g-child' },
  { id: 'r-other', projectGroupId: null }
]

describe('getRenderableFolderWorkspaces with a space', () => {
  it('shows a folder workspace when a repo in the group subtree is a member', () => {
    expect(
      getRenderableFolderWorkspaces([fw], groups, {
        activeSpaceRepoIds: new Set(['r-child']),
        repos
      })
    ).toHaveLength(1)
  })
  it('hides it when no repo in the subtree is a member', () => {
    expect(
      getRenderableFolderWorkspaces([fw], groups, {
        activeSpaceRepoIds: new Set(['r-other']),
        repos
      })
    ).toHaveLength(0)
  })
  it('ignores the rule under 全部', () => {
    expect(
      getRenderableFolderWorkspaces([fw], groups, { activeSpaceRepoIds: undefined, repos })
    ).toHaveLength(1)
  })
})
