import { describe, expect, it } from 'vitest'
import {
  groupWorktreeItemsByProject,
  isSpaceScopeFilter,
  planQueryScopeFilter,
  planSpaceSeed
} from './palette-space-scope'

describe('groupWorktreeItemsByProject', () => {
  it('keeps rows of one project adjacent, blocks ordered by their first (most recent) row', () => {
    const items = [
      { id: 'a1', repoId: 'a' },
      { id: 'b1', repoId: 'b' },
      { id: 'a2', repoId: 'a' },
      { id: 'c1', repoId: 'c' }
    ]
    expect(groupWorktreeItemsByProject(items, (w) => w.repoId).map((i) => i.id)).toEqual([
      'a1',
      'a2',
      'b1',
      'c1'
    ])
  })
})

describe('isSpaceScopeFilter', () => {
  it('is true when the filter repoIds exactly matches the space repo ids, ignoring order', () => {
    expect(isSpaceScopeFilter({ repoIds: ['b', 'a'] }, ['a', 'b'])).toBe(true)
  })
  it('is false when either side is empty', () => {
    expect(isSpaceScopeFilter({ repoIds: [] }, ['a'])).toBe(false)
    expect(isSpaceScopeFilter({ repoIds: ['a'] }, [])).toBe(false)
    expect(isSpaceScopeFilter({ repoIds: [] }, [])).toBe(false)
  })
  it('is false when the sets differ', () => {
    expect(isSpaceScopeFilter({ repoIds: ['a', 'c'] }, ['a', 'b'])).toBe(false)
    expect(isSpaceScopeFilter({ repoIds: ['a'] }, ['a', 'b'])).toBe(false)
  })
})

describe('planSpaceSeed', () => {
  const repoIds = new Set(['r2', 'r1'])

  it('returns null when there is no active space', () => {
    expect(
      planSpaceSeed({ activeSpaceId: null, activeSpaceRepoIds: undefined, seededSpaceId: null })
    ).toBeNull()
  })

  it('returns null when already seeded for this space id', () => {
    expect(
      planSpaceSeed({ activeSpaceId: 's1', activeSpaceRepoIds: repoIds, seededSpaceId: 's1' })
    ).toBeNull()
  })

  it('returns null while the repo set is empty (not hydrated yet)', () => {
    expect(
      planSpaceSeed({ activeSpaceId: 's1', activeSpaceRepoIds: new Set(), seededSpaceId: null })
    ).toBeNull()
  })

  it('returns the sorted seed for a fresh space', () => {
    expect(
      planSpaceSeed({ activeSpaceId: 's1', activeSpaceRepoIds: repoIds, seededSpaceId: null })
    ).toEqual({ spaceId: 's1', repoIds: ['r1', 'r2'] })
  })
})

describe('planQueryScopeFilter', () => {
  it('drops the repository axis while the chips are exactly the space seed', () => {
    const scoped = planQueryScopeFilter({ hostIds: ['ssh:a'], repoIds: ['r2', 'r1'] }, ['r1', 'r2'])
    expect(scoped.repoIds).toEqual([])
    expect(scoped.hostIds).toEqual(['ssh:a'])
  })
  it('keeps the user own repository chips and returns the same reference', () => {
    const filter = { hostIds: [], repoIds: ['r1'] }
    expect(planQueryScopeFilter(filter, ['r1', 'r2'])).toBe(filter)
  })
  it('returns the same reference outside a space', () => {
    const filter = { hostIds: [], repoIds: ['r1'] }
    expect(planQueryScopeFilter(filter, null)).toBe(filter)
  })
})
