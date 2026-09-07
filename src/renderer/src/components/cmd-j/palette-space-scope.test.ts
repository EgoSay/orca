import { describe, expect, it } from 'vitest'
import {
  groupWorktreeItemsByProject,
  isSpaceScopeFilter,
  spaceToPaletteProjectKeys
} from './palette-space-scope'

describe('spaceToPaletteProjectKeys', () => {
  it('expands project: members to every matching palette project key, including ::setup variants', () => {
    const model = {
      projects: [
        { id: 'project:p1' },
        { id: 'project:p1::setup:r2' },
        { id: 'repo:legacy' },
        { id: 'project:p9' }
      ]
    } as never
    expect(
      spaceToPaletteProjectKeys({ memberIds: ['project:p1', 'repo:legacy'] }, model).sort()
    ).toEqual(['project:p1', 'project:p1::setup:r2', 'repo:legacy'])
  })
})

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
  it('is true when the filter projectKeys exactly matches the space keys, ignoring order', () => {
    expect(isSpaceScopeFilter({ projectKeys: ['b', 'a'] }, ['a', 'b'])).toBe(true)
  })
  it('is false when either side is empty', () => {
    expect(isSpaceScopeFilter({ projectKeys: [] }, ['a'])).toBe(false)
    expect(isSpaceScopeFilter({ projectKeys: ['a'] }, [])).toBe(false)
    expect(isSpaceScopeFilter({ projectKeys: [] }, [])).toBe(false)
  })
  it('is false when the sets differ', () => {
    expect(isSpaceScopeFilter({ projectKeys: ['a', 'c'] }, ['a', 'b'])).toBe(false)
    expect(isSpaceScopeFilter({ projectKeys: ['a'] }, ['a', 'b'])).toBe(false)
  })
})
