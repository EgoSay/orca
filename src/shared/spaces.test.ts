import { describe, expect, it } from 'vitest'
import { createSpace, isSpaceMemberId, normalizeActiveSpaceId, normalizeSpaces } from './spaces'

describe('normalizeSpaces', () => {
  it('drops malformed rows, dedupes ids and member ids, sorts by sortOrder', () => {
    const spaces = normalizeSpaces([
      { id: 'b', name: ' 写作 ', memberIds: ['project:p1', 'project:p1', 'bogus'], sortOrder: 2 },
      { id: 'a', name: '', memberIds: 'nope', sortOrder: 1 },
      { id: 'a', name: 'dup' },
      null,
      { name: 'no id' }
    ])
    expect(spaces.map((s) => s.id)).toEqual(['a', 'b'])
    expect(spaces[0].name).toBe('Untitled space')
    expect(spaces[0].memberIds).toEqual([])
    expect(spaces[1].name).toBe('写作')
    expect(spaces[1].memberIds).toEqual(['project:p1'])
  })
  it('returns [] for non-arrays', () => {
    expect(normalizeSpaces(undefined)).toEqual([])
  })
  // Why: an empty string reaches SpaceDot as `background: ''` — a transparent dot.
  it('collapses an empty color to null, like icon', () => {
    const [space] = normalizeSpaces([{ id: 'a', name: 'x', color: '', icon: '', memberIds: [] }])
    expect(space.color).toBeNull()
    expect(space.icon).toBeNull()
  })
})

describe('normalizeActiveSpaceId', () => {
  const spaces = [createSpace({ name: 'x', memberIds: [], sortOrder: 0, now: 1 })]
  it('keeps an id that exists and nulls one that does not', () => {
    expect(normalizeActiveSpaceId(spaces[0].id, spaces)).toBe(spaces[0].id)
    expect(normalizeActiveSpaceId('gone', spaces)).toBeNull()
    expect(normalizeActiveSpaceId(undefined, spaces)).toBeNull()
  })
})

describe('isSpaceMemberId', () => {
  it('accepts a non-empty suffix for each known prefix and rejects everything else', () => {
    expect(isSpaceMemberId('repo:r1')).toBe(true)
    expect(isSpaceMemberId('project:p')).toBe(true)
    expect(isSpaceMemberId('repo:')).toBe(false)
    expect(isSpaceMemberId('project:')).toBe(false)
    expect(isSpaceMemberId('other:x')).toBe(false)
    expect(isSpaceMemberId(42)).toBe(false)
  })
})
