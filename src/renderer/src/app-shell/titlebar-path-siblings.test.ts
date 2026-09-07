import { describe, expect, it } from 'vitest'
import { buildTitlebarPath } from './titlebar-path-siblings'

const baseState = {
  spaces: [
    {
      id: 's',
      name: '开发',
      icon: null,
      color: '#1447e6',
      memberIds: ['repo:r1'],
      sortOrder: 0,
      createdAt: 0,
      updatedAt: 0
    }
  ],
  activeSpaceId: 's',
  repos: [
    { id: 'r1', displayName: 'orca' },
    { id: 'r2', displayName: 'blog' }
  ],
  projectHostSetups: [],
  activeWorktreeId: 'w1',
  worktreesByRepo: {
    r1: [{ id: 'w1', repoId: 'r1', displayName: 'feat', branch: 'feat', isArchived: false }],
    r2: [{ id: 'w2', repoId: 'r2', displayName: 'main', branch: 'main', isArchived: false }]
  },
  lastVisitedAtByWorktreeId: {}
}
const state = baseState as never

describe('buildTitlebarPath', () => {
  it('lists spaces + 全部, member projects, and sibling worktrees with the current ones marked', () => {
    const path = buildTitlebarPath(state)!
    expect(path.space.label).toBe('开发')
    expect(path.space.siblings.map((s) => s.id)).toEqual(['s', 'all'])
    expect(path.project.siblings.map((s) => s.id)).toEqual(['r1'])
    expect(path.worktree.siblings.find((s) => s.current)?.id).toBe('w1')
  })

  it('returns null without an active worktree', () => {
    expect(buildTitlebarPath({ ...baseState, activeWorktreeId: null } as never)).toBeNull()
  })
})
