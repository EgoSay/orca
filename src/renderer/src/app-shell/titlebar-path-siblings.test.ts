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
  allWorktrees: [
    { id: 'w1', repoId: 'r1', displayName: 'feat', branch: 'feat', isArchived: false },
    { id: 'w2', repoId: 'r2', displayName: 'main', branch: 'main', isArchived: false }
  ],
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

  it('marks the active project and worktree current, with worktree detail set to its branch', () => {
    const path = buildTitlebarPath(state)!
    expect(path.project.siblings.find((s) => s.current)?.id).toBe('r1')
    const currentWorktree = path.worktree.siblings.find((s) => s.current)
    expect(currentWorktree?.id).toBe('w1')
    expect(currentWorktree?.detail).toBe('feat')
  })

  it('keeps the current project listed as a guest alongside the space members', () => {
    // r2 is not a member of space 's' (memberIds only has repo:r1), but its worktree is active.
    const guestState = { ...baseState, activeWorktreeId: 'w2' } as never
    const path = buildTitlebarPath(guestState)!
    // Order is by project recency; with no ranked project both fall back to display name.
    expect(path.project.siblings.map((s) => s.id)).toEqual(['r2', 'r1'])
    expect(path.project.siblings.find((s) => s.id === 'r2')?.current).toBe(true)
    expect(path.project.siblings.find((s) => s.id === 'r1')?.current).toBe(false)
  })

  it('lists every repo and marks 全部 current when no space is active', () => {
    const allState = { ...baseState, activeSpaceId: null } as never
    const path = buildTitlebarPath(allState)!
    expect(path.space.siblings.find((s) => s.id === 'all')?.current).toBe(true)
    expect(path.space.siblings.every((s) => s.id === 'all' || s.current === false)).toBe(true)
    expect(path.project.siblings.map((s) => s.id).sort()).toEqual(['r1', 'r2'])
  })

  // Why: same order as the space member list — repo-catalog order is arbitrary.
  it('orders sibling projects by project recency', () => {
    const recencyState = {
      ...baseState,
      repos: [
        { id: 'r1', displayName: 'orca' },
        { id: 'r2', displayName: 'blog' }
      ],
      spaces: [{ ...baseState.spaces[0], memberIds: ['project:p1', 'project:p2'] }],
      projectHostSetups: [
        { id: 'sh1', repoId: 'r1', projectId: 'p1', hostId: 'local' },
        { id: 'sh2', repoId: 'r2', projectId: 'p2', hostId: 'local' }
      ],
      allWorktrees: [
        {
          id: 'w1',
          repoId: 'r1',
          projectId: 'p1',
          displayName: 'feat',
          branch: 'feat',
          isArchived: false,
          createdAt: 5
        },
        {
          id: 'w2',
          repoId: 'r2',
          projectId: 'p2',
          displayName: 'main',
          branch: 'main',
          isArchived: false,
          createdAt: 90
        }
      ]
    } as never

    const path = buildTitlebarPath(recencyState)!
    expect(path.project.siblings.map((s) => s.id)).toEqual(['r2', 'r1'])
  })
})
