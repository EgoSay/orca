import { describe, expect, it } from 'vitest'
import {
  createSpace,
  normalizeActiveSpaceId,
  normalizeSpaces,
  pruneMissingSpaceMembers
} from './spaces'

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
})

describe('pruneMissingSpaceMembers', () => {
  it('removes members that no longer resolve and keeps identity when unchanged', () => {
    const input = [
      createSpace({ name: 'x', memberIds: ['project:p1', 'repo:r9'], sortOrder: 0, now: 1 })
    ]
    const pruned = pruneMissingSpaceMembers(input, new Set(['project:p1']))
    expect(pruned[0].memberIds).toEqual(['project:p1'])
    const same = pruneMissingSpaceMembers(pruned, new Set(['project:p1']))
    expect(same).toBe(pruned)
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
