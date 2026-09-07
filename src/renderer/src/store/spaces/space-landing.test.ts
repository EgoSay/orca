import { describe, expect, it } from 'vitest'
import { pickSpaceLandingWorktree } from './space-landing'
import type { Worktree } from '../../../../shared/worktree/types'

function wt(id: string, repoId: string, isMainWorktree = false, lastActivityAt = 0): Worktree {
  return {
    id,
    repoId,
    path: `/tmp/${id}`,
    head: 'abc',
    branch: 'refs/heads/x',
    isBare: false,
    isMainWorktree,
    displayName: id,
    comment: '',
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    isUnread: false,
    isPinned: false,
    sortOrder: 0,
    lastActivityAt
  }
}

describe('pickSpaceLandingWorktree', () => {
  const worktrees = [wt('a-main', 'ra', true), wt('a-feat', 'ra'), wt('b-main', 'rb', true)]
  it('picks the most recently visited member worktree', () => {
    const pick = pickSpaceLandingWorktree({
      worktrees,
      memberRepoIds: new Set(['ra', 'rb']),
      lastVisitedAtByWorktreeId: { 'a-feat': 5, 'b-main': 9, 'a-main': 1 }
    })
    expect(pick?.id).toBe('b-main')
  })
  it('falls back to a member main worktree when nothing was visited', () => {
    const pick = pickSpaceLandingWorktree({
      worktrees,
      memberRepoIds: new Set(['ra']),
      lastVisitedAtByWorktreeId: {}
    })
    expect(pick?.id).toBe('a-main')
  })
  // Why: "first main" is repo-catalog order, which has nothing to do with where
  // the user was working — land on the freshest project's main instead.
  it('prefers the most recently active project main when nothing was visited', () => {
    const stale = wt('stale-main', 'r-stale', true, 10)
    const fresh = wt('fresh-main', 'r-fresh', true, 900)
    const pick = pickSpaceLandingWorktree({
      worktrees: [stale, fresh],
      memberRepoIds: new Set(['r-stale', 'r-fresh']),
      lastVisitedAtByWorktreeId: {}
    })
    expect(pick?.id).toBe('fresh-main')
  })
  it('falls back to the freshest member when the space has no main worktree', () => {
    const older = wt('older', 'r1', false, 3)
    const newer = wt('newer', 'r1', false, 40)
    const pick = pickSpaceLandingWorktree({
      worktrees: [older, newer],
      memberRepoIds: new Set(['r1']),
      lastVisitedAtByWorktreeId: {}
    })
    expect(pick?.id).toBe('newer')
  })
  it('returns null for an empty space and ignores archived rows', () => {
    expect(
      pickSpaceLandingWorktree({
        worktrees,
        memberRepoIds: new Set(),
        lastVisitedAtByWorktreeId: {}
      })
    ).toBeNull()
    const archived = [{ ...wt('z', 'rz'), isArchived: true }]
    expect(
      pickSpaceLandingWorktree({
        worktrees: archived,
        memberRepoIds: new Set(['rz']),
        lastVisitedAtByWorktreeId: { z: 3 }
      })
    ).toBeNull()
  })
})
