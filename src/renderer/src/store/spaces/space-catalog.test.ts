import { describe, expect, it } from 'vitest'
import {
  selectActiveSpaceRepoIds,
  selectSetupByRepoId,
  selectSpacesContainingRepo
} from './space-catalog'

const setups = [
  {
    id: 's',
    projectId: 'github:acme/app',
    hostId: 'local',
    repoId: 'r1',
    path: '/tmp/r1',
    displayName: 'r1',
    setupState: 'ready',
    setupMethod: 'imported-existing-folder',
    createdAt: 0,
    updatedAt: 0
  }
] as never
const repos = [
  { id: 'r1', path: '/tmp/r1', displayName: 'r1', badgeColor: '#000', addedAt: 0 },
  { id: 'r2', path: '/tmp/r2', displayName: 'r2', badgeColor: '#000', addedAt: 0 }
] as never
const spaces = [
  {
    id: 'a',
    name: 'a',
    icon: null,
    color: null,
    memberIds: ['project:github:acme/app'],
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0
  }
] as never

describe('space-catalog selectors', () => {
  it('returns undefined for 全部 and a memoized repo id set for a space', () => {
    expect(
      selectActiveSpaceRepoIds({ spaces, activeSpaceId: null, repos, projectHostSetups: setups })
    ).toBeUndefined()
    const state = { spaces, activeSpaceId: 'a', repos, projectHostSetups: setups }
    const first = selectActiveSpaceRepoIds(state)
    expect([...first!]).toEqual(['r1'])
    expect(selectActiveSpaceRepoIds(state)).toBe(first)
  })
  it('lists spaces containing a repo via its normalized member id', () => {
    const state = { spaces, activeSpaceId: 'a', repos, projectHostSetups: setups }
    expect(selectSpacesContainingRepo(state, 'r1').map((s) => s.id)).toEqual(['a'])
    expect(selectSpacesContainingRepo(state, 'r2')).toEqual([])
  })
  it('memoizes the setup-by-repo-id map on the projectHostSetups array reference', () => {
    const first = selectSetupByRepoId({ projectHostSetups: setups })
    expect(selectSetupByRepoId({ projectHostSetups: setups })).toBe(first)
    const otherSetups = [...setups] as never
    expect(selectSetupByRepoId({ projectHostSetups: otherSetups })).not.toBe(first)
  })
})
