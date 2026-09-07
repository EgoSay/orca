import { describe, expect, it } from 'vitest'
import type { PersistedState } from '../../../shared/persisted-state-types'
import { removeRepoFromSpaces } from './space-member-removal'

function setup(repoId: string, projectId: string): PersistedState['projectHostSetups'][number] {
  return {
    id: `s-${repoId}`,
    projectId,
    hostId: 'local',
    repoId,
    path: `/tmp/${repoId}`,
    displayName: repoId,
    setupState: 'ready',
    setupMethod: 'imported-existing-folder',
    createdAt: 0,
    updatedAt: 0
  } as PersistedState['projectHostSetups'][number]
}

function repo(id: string): PersistedState['repos'][number] {
  return {
    id,
    path: `/tmp/${id}`,
    displayName: id,
    badgeColor: '#000',
    addedAt: 0
  } as PersistedState['repos'][number]
}

function space(id: string, memberIds: string[]): PersistedState['spaces'][number] {
  return {
    id,
    name: id,
    icon: null,
    color: null,
    memberIds,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1
  } as PersistedState['spaces'][number]
}

describe('removeRepoFromSpaces', () => {
  it('strips the departing member id from every space and leaves the others intact', () => {
    const state = {
      repos: [repo('r2')],
      projectHostSetups: [setup('r1', 'github:acme/app'), setup('r2', 'github:acme/other')],
      spaces: [
        space('a', ['project:github:acme/app', 'project:github:acme/other']),
        space('b', ['project:github:acme/app']),
        space('c', ['repo:r-remote'])
      ]
    }
    expect(removeRepoFromSpaces(state, 'r1')).toBe(true)
    expect(state.spaces[0].memberIds).toEqual(['project:github:acme/other'])
    expect(state.spaces[1].memberIds).toEqual([])
    expect(state.spaces[2].memberIds).toEqual(['repo:r-remote'])
  })

  it('keeps the member id while another host copy of the same project survives', () => {
    const state = {
      repos: [repo('r-ssh')],
      projectHostSetups: [setup('r1', 'github:acme/app'), setup('r-ssh', 'github:acme/app')],
      spaces: [space('a', ['project:github:acme/app'])]
    }
    expect(removeRepoFromSpaces(state, 'r1')).toBe(false)
    expect(state.spaces[0].memberIds).toEqual(['project:github:acme/app'])
  })

  it('strips a legacy repo: member when no setup row backs the repo', () => {
    const state = {
      repos: [],
      projectHostSetups: [],
      spaces: [space('a', ['repo:r1', 'repo:r2'])]
    }
    expect(removeRepoFromSpaces(state, 'r1')).toBe(true)
    expect(state.spaces[0].memberIds).toEqual(['repo:r2'])
  })

  it('reports no change when the repo was in no space', () => {
    const state = {
      repos: [],
      projectHostSetups: [],
      spaces: [space('a', ['repo:r9'])]
    }
    expect(removeRepoFromSpaces(state, 'r1')).toBe(false)
  })
})
