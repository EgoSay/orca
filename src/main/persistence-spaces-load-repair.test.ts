import { describe, expect, it } from 'vitest'
import { repairLoadedSpaces } from './persistence/loading-store/spaces-load-repair'
import type { PersistedState } from '../shared/persisted-state-types'

function stateWith(partial: Partial<PersistedState>): PersistedState {
  return {
    repos: [{ id: 'r1', path: '/tmp/r1', displayName: 'r1', badgeColor: '#000', addedAt: 0 }],
    projects: [],
    projectHostSetups: [
      {
        id: 's1',
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
    ],
    ui: { activeSpaceId: 'gone' } as PersistedState['ui'],
    ...partial
  } as PersistedState
}

describe('repairLoadedSpaces', () => {
  it('normalizes spaces and nulls a dangling activeSpaceId', () => {
    const repaired = repairLoadedSpaces(
      stateWith({
        spaces: [
          {
            id: 'a',
            name: '开发',
            memberIds: ['project:github:acme/app', 'project:github:acme/app', 'bogus'],
            sortOrder: 0
          }
        ] as unknown as PersistedState['spaces']
      })
    )
    expect(repaired.changed).toBe(true)
    expect(repaired.spaces[0].memberIds).toEqual(['project:github:acme/app'])
    expect(repaired.activeSpaceId).toBeNull()
  })
  it('keeps a member whose repo is absent from the local catalog (runtime-host projects)', () => {
    const repaired = repairLoadedSpaces(
      stateWith({
        repos: [],
        projectHostSetups: [],
        spaces: [
          {
            id: 'a',
            name: '开发',
            icon: null,
            color: null,
            memberIds: ['project:github:acme/remote-only', 'repo:r-remote'],
            sortOrder: 0,
            createdAt: 1,
            updatedAt: 1
          }
        ],
        ui: { activeSpaceId: 'a' } as PersistedState['ui']
      })
    )
    expect(repaired.spaces[0].memberIds).toEqual([
      'project:github:acme/remote-only',
      'repo:r-remote'
    ])
    expect(repaired.changed).toBe(false)
  })
  it('reports unchanged when spaces are already clean', () => {
    const clean = repairLoadedSpaces(
      stateWith({
        spaces: [
          {
            id: 'a',
            name: '开发',
            icon: null,
            color: null,
            memberIds: ['project:github:acme/app'],
            sortOrder: 0,
            createdAt: 1,
            updatedAt: 1
          }
        ],
        ui: { activeSpaceId: 'a' } as PersistedState['ui']
      })
    )
    expect(clean.changed).toBe(false)
    expect(clean.activeSpaceId).toBe('a')
  })
})
