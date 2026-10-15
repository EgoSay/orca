import { describe, expect, it, vi } from 'vitest'
import { Store } from './persistence/loading-store/store'
import { createSqliteMaintenanceFixture } from './persistence/loading-store/profile-state-maintenance-fixture'

vi.mock('./telemetry/client', () => ({ track: vi.fn() }))
vi.mock('./telemetry/cohort-classifier', () => ({
  getCohortAtEmit: () => ({ nth_repo_added: 2 })
}))
vi.mock('./ssh/ssh-config-parser', () => ({
  loadUserSshConfig: () => ({ hosts: [] }),
  sshConfigHostsToTargets: () => []
}))

describe('Space persistence on the upstream SQLite authority', () => {
  it('round-trips spaces, remote-only membership and the selected space', async () => {
    const { store, authority, dataFile } = createSqliteMaintenanceFixture()
    const space = store.createSpace({
      name: 'Writing',
      memberIds: ['project:remote-only', 'repo:remote-only']
    })
    store.updateUI({ activeSpaceId: space.id })
    await store.flushPendingOrThrowAsync()

    const reloaded = new Store({
      dataFile,
      serializedState: authority.readSerializedState() ?? '{}'
    })
    expect(reloaded.getSpaces()).toEqual([space])
    expect(reloaded.getUI().activeSpaceId).toBe(space.id)

    store.deleteSpace(space.id)
    await store.flushPendingOrThrowAsync()
    const afterDelete = new Store({
      dataFile,
      serializedState: authority.readSerializedState() ?? '{}'
    })
    expect(afterDelete.getSpaces()).toEqual([])
    expect(afterDelete.getUI().activeSpaceId).toBeNull()
  })

  it('retains shared project membership until its last host copy is removed', async () => {
    const { store, authority, dataFile } = createSqliteMaintenanceFixture()
    store.updateRepo('repo-local', { upstream: { owner: 'acme', repo: 'shared' } })
    store.updateRepo(
      'repo-remote',
      { upstream: { owner: 'acme', repo: 'shared' } },
      'ssh:build-host'
    )
    const setup = store.getProjectHostSetups().find((entry) => entry.repoId === 'repo-local')
    if (!setup) {
      throw new Error('Fixture is missing the local project setup')
    }
    const memberId = `project:${setup.projectId}` as const
    store.createSpace({ name: 'Development', memberIds: [memberId] })
    store.removeProjectForHost('repo-local', 'local')
    expect(store.getSpaces()[0].memberIds).toEqual([memberId])
    store.removeProjectForHost('repo-remote', 'ssh:build-host')
    expect(store.getSpaces()[0].memberIds).toEqual([])
    await store.flushPendingOrThrowAsync()
    const reloaded = new Store({
      dataFile,
      serializedState: authority.readSerializedState() ?? '{}'
    })
    expect(reloaded.getSpaces()[0].memberIds).toEqual([])
  })
})
