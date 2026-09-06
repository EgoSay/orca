import { describe, expect, it } from 'vitest'
import { buildSetupByRepoId, resolveSpaceRepoIds, toSpaceMemberId } from './space-membership'
import type { ProjectHostSetup } from './project-types'
import type { Repo } from './repo-types'
import type { Space } from './space-types'

function setup(repoId: string, projectId: string): ProjectHostSetup {
  return {
    id: `setup-${repoId}`,
    projectId,
    hostId: 'local',
    repoId,
    path: `/tmp/${repoId}`,
    displayName: repoId,
    setupState: 'ready',
    setupMethod: 'imported-existing-folder',
    createdAt: 0,
    updatedAt: 0
  }
}

function repo(id: string): Repo {
  return { id, path: `/tmp/${id}`, displayName: id, badgeColor: '#000', addedAt: 0 }
}

function space(memberIds: Space['memberIds']): Space {
  return {
    id: 's1',
    name: '开发',
    icon: null,
    color: null,
    memberIds,
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0
  }
}

describe('toSpaceMemberId', () => {
  it('prefers project: when the repo has a host setup', () => {
    const byRepo = buildSetupByRepoId([setup('r1', 'github:acme/app')])
    expect(toSpaceMemberId('r1', byRepo)).toBe('project:github:acme/app')
  })
  it('falls back to repo: for a legacy repo without a setup', () => {
    expect(toSpaceMemberId('r-legacy', new Map())).toBe('repo:r-legacy')
  })
})

describe('resolveSpaceRepoIds', () => {
  it('collapses one project across two hosts into both repo ids', () => {
    const byRepo = buildSetupByRepoId([
      setup('r-local', 'github:acme/app'),
      setup('r-ssh', 'github:acme/app')
    ])
    const ids = resolveSpaceRepoIds(space(['project:github:acme/app']), [repo('r-local'), repo('r-ssh'), repo('r-other')], byRepo)
    expect([...ids].sort()).toEqual(['r-local', 'r-ssh'])
  })
  it('matches a legacy repo by repo: id', () => {
    const ids = resolveSpaceRepoIds(space(['repo:r-legacy']), [repo('r-legacy'), repo('r2')], new Map())
    expect([...ids]).toEqual(['r-legacy'])
  })
})
