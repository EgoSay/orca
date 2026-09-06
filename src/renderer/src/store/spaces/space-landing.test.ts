import { describe, expect, it } from 'vitest'
import { pickSpaceLandingWorktree } from './space-landing'
import type { Worktree } from '../../../../shared/worktree/types'

function wt(id: string, repoId: string, isMainWorktree = false): Worktree {
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
    lastActivityAt: 0
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
