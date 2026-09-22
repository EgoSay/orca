import { describe, expect, it, vi } from 'vitest'
import { SpacePersistenceOperations } from './space-operations'
import type { PersistedState } from '../../../shared/persisted-state-types'

function makeOps() {
  const state = { spaces: [] } as unknown as PersistedState
  const scheduleSave = vi.fn()
  return { ops: new SpacePersistenceOperations({ state, scheduleSave }), state, scheduleSave }
}

describe('SpacePersistenceOperations', () => {
  it('creates with the next sortOrder and schedules a save', () => {
    const { ops, scheduleSave } = makeOps()
    const a = ops.createSpace({ name: '写作', memberIds: ['project:p1'] })
    const b = ops.createSpace({ name: '开发', memberIds: [] })
    expect(a.sortOrder).toBe(0)
    expect(b.sortOrder).toBe(1)
    expect(scheduleSave).toHaveBeenCalledTimes(2)
  })
  it('updates name/icon/color and dedupes member ids', () => {
    const { ops } = makeOps()
    const a = ops.createSpace({ name: 'x', memberIds: [] })
    expect(ops.updateSpace(a.id, { name: '  改名 ', icon: '✍️', color: '#123' })).toMatchObject({
      name: '改名',
      icon: '✍️',
      color: '#123'
    })
    expect(ops.setSpaceMembers(a.id, ['repo:r1', 'repo:r1', 'project:p2'])?.memberIds).toEqual([
      'repo:r1',
      'project:p2'
    ])
    expect(ops.updateSpace('missing', { name: 'x' })).toBeNull()
  })
  it('deletes only the space row and reorders by id list', () => {
    const { ops } = makeOps()
    const a = ops.createSpace({ name: 'a', memberIds: [] })
    const b = ops.createSpace({ name: 'b', memberIds: [] })
    expect(ops.reorderSpaces([b.id, a.id]).map((s) => s.id)).toEqual([b.id, a.id])
    expect(ops.deleteSpace(a.id)).toBe(true)
    expect(ops.deleteSpace(a.id)).toBe(false)
    expect(ops.getSpaces().map((s) => s.id)).toEqual([b.id])
  })
})
