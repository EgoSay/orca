import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import { createTestStore } from './store-test-helpers'

function worktree(overrides: Partial<Worktree> & { id: string; repoId: string }): Worktree {
  return {
    path: `/tmp/${overrides.id}`,
    head: 'abc',
    branch: `refs/heads/${overrides.id}`,
    isBare: false,
    isMainWorktree: true,
    displayName: overrides.id,
    comment: '',
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    isUnread: false,
    isPinned: false,
    sortOrder: 0,
    lastActivityAt: 0,
    ...overrides
  }
}

function space(id: string, memberIds: string[]) {
  return {
    id,
    name: id,
    icon: null,
    color: null,
    memberIds,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1
  }
}

function stubUiSetApi(): ReturnType<typeof vi.fn> {
  const set = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('window', { api: { ui: { set } } })
  return set
}

/** The web client's withFallback proxy: every method resolves undefined, none throws. */
function stubFallbackSpacesApi(): void {
  vi.stubGlobal('window', {
    api: {
      spaces: {
        list: async () => undefined,
        create: async () => undefined,
        update: async () => undefined,
        setMembers: async () => undefined,
        delete: async () => undefined,
        reorder: async () => undefined,
        onChanged: () => () => {}
      },
      ui: { set: async () => undefined }
    }
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('spaces slice against the web fallback API', () => {
  it('leaves spacesHydrated false and spaces empty when list() resolves undefined', async () => {
    stubFallbackSpacesApi()
    const store = createTestStore()
    await store.getState().loadSpaces()
    expect(store.getState().spacesHydrated).toBe(false)
    expect(store.getState().spaces).toEqual([])
  })

  it('writes nothing and throws nothing when create() resolves undefined', async () => {
    stubFallbackSpacesApi()
    const store = createTestStore()
    await expect(store.getState().createSpace({ name: 'x', memberIds: [] })).resolves.toBeNull()
    expect(store.getState().spaces).toEqual([])
  })

  it('keeps the existing list when reorder() resolves undefined', async () => {
    stubFallbackSpacesApi()
    const store = createTestStore()
    const existing = [
      {
        id: 'a',
        name: 'A',
        icon: null,
        color: null,
        memberIds: [],
        sortOrder: 0,
        createdAt: 1,
        updatedAt: 1
      }
    ]
    store.setState({ spaces: existing })
    await store.getState().reorderSpaces(['a'])
    expect(store.getState().spaces).toBe(existing)
  })
})

describe('activateSpace', () => {
  it('persists activeSpaceId through window.api.ui.set', () => {
    const set = stubUiSetApi()
    const store = createTestStore()
    store.setState({ spaces: [space('a', [])] as never })

    store.getState().activateSpace('a')

    expect(store.getState().activeSpaceId).toBe('a')
    expect(set).toHaveBeenCalledWith({ activeSpaceId: 'a' })

    store.getState().activateSpace(null)
    expect(store.getState().activeSpaceId).toBeNull()
    expect(set).toHaveBeenLastCalledWith({ activeSpaceId: null })
  })

  // Why STA-4343: the same bare worktree id can be registered on two hosts, so an
  // id match alone is not evidence the target is already the active workspace.
  it('does not skip activation when the same bare id is active on another host', () => {
    stubUiSetApi()
    const store = createTestStore()
    const setActiveWorktree = vi.fn()
    const target = worktree({ id: 'shared', repoId: 'r1', hostId: 'ssh:box' })
    store.setState({
      spaces: [space('a', ['repo:r1'])] as never,
      repos: [{ id: 'r1', path: '/r1', displayName: 'r1', badgeColor: '#000', addedAt: 0 }],
      projectHostSetups: [],
      worktreesByRepo: { r1: [target] },
      activeWorktreeId: 'shared',
      activeWorkspaceExecutionHostId: 'local',
      lastVisitedAtByWorktreeId: {},
      setActiveWorktree
    } as never)

    store.getState().activateSpace('a')

    expect(setActiveWorktree).toHaveBeenCalledWith('shared', 'ssh:box')
  })

  it('skips activation when the target is already active on the same host', () => {
    stubUiSetApi()
    const store = createTestStore()
    const setActiveWorktree = vi.fn()
    const target = worktree({ id: 'shared', repoId: 'r1', hostId: 'ssh:box' })
    store.setState({
      spaces: [space('a', ['repo:r1'])] as never,
      repos: [{ id: 'r1', path: '/r1', displayName: 'r1', badgeColor: '#000', addedAt: 0 }],
      projectHostSetups: [],
      worktreesByRepo: { r1: [target] },
      activeWorktreeId: 'shared',
      activeWorkspaceExecutionHostId: 'ssh:box',
      lastVisitedAtByWorktreeId: {},
      setActiveWorktree
    } as never)

    store.getState().activateSpace('a')

    expect(setActiveWorktree).not.toHaveBeenCalled()
  })

  // Why spec §5 fallback 3: an empty space keeps the current workspace; the guest row covers it.
  it('keeps the current workspace pointer when the space has no members', () => {
    stubUiSetApi()
    const store = createTestStore()
    const setActiveWorktree = vi.fn()
    store.setState({
      spaces: [space('empty', [])] as never,
      repos: [{ id: 'r1', path: '/r1', displayName: 'r1', badgeColor: '#000', addedAt: 0 }],
      projectHostSetups: [],
      worktreesByRepo: { r1: [worktree({ id: 'w1', repoId: 'r1' })] },
      activeWorktreeId: 'w1',
      lastVisitedAtByWorktreeId: {},
      setActiveWorktree
    } as never)

    store.getState().activateSpace('empty')

    expect(store.getState().activeSpaceId).toBe('empty')
    expect(setActiveWorktree).not.toHaveBeenCalled()
    expect(store.getState().activeWorktreeId).toBe('w1')
  })
})
