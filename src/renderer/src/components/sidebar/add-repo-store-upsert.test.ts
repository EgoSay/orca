import { describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { upsertAddedRepoWithProjectHostSetup } from './add-repo-store-upsert'

describe('upsertAddedRepoWithProjectHostSetup', () => {
  it('adds a new repo to the active space', () => {
    const addSpaceMember = vi.fn(async () => {})
    useAppStore.setState({
      repos: [],
      projects: [],
      projectHostSetups: [],
      activeSpaceId: 's1',
      addSpaceMember
    } as never)
    upsertAddedRepoWithProjectHostSetup({
      id: 'r1',
      path: '/r1',
      displayName: 'r1',
      badgeColor: '#000',
      addedAt: 0
    } as never)
    expect(addSpaceMember).toHaveBeenCalledWith('s1', expect.stringMatching(/^(project|repo):/))
  })

  it('does not join a space when there is no active space', () => {
    const addSpaceMember = vi.fn(async () => {})
    useAppStore.setState({
      repos: [],
      projects: [],
      projectHostSetups: [],
      activeSpaceId: null,
      addSpaceMember
    } as never)
    upsertAddedRepoWithProjectHostSetup({
      id: 'r2',
      path: '/r2',
      displayName: 'r2',
      badgeColor: '#000',
      addedAt: 0
    } as never)
    expect(addSpaceMember).not.toHaveBeenCalled()
  })

  it('does not join a space when the repo was already present', () => {
    const addSpaceMember = vi.fn(async () => {})
    const existing = { id: 'r3', path: '/r3', displayName: 'r3', badgeColor: '#000', addedAt: 0 }
    useAppStore.setState({
      repos: [existing],
      projects: [],
      projectHostSetups: [],
      activeSpaceId: 's1',
      addSpaceMember
    } as never)
    upsertAddedRepoWithProjectHostSetup(existing as never)
    expect(addSpaceMember).not.toHaveBeenCalled()
  })
})
