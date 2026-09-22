import { describe, expect, it, vi } from 'vitest'

const handlers = new Map<string, (event: unknown, args?: unknown) => unknown>()
vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, fn: (event: unknown, args?: unknown) => unknown) =>
      handlers.set(channel, fn),
    removeHandler: vi.fn()
  }
}))

import { registerSpaceHandlers } from './space-handlers'

describe('registerSpaceHandlers', () => {
  it('validates args and broadcasts spaces:changed after a mutation', () => {
    const send = vi.fn()
    const mainWindow = { isDestroyed: () => false, webContents: { send } } as never
    const store = {
      getSpaces: vi.fn(() => []),
      createSpace: vi.fn((input) => ({ id: 's1', ...input })),
      updateSpace: vi.fn(() => null),
      setSpaceMembers: vi.fn(() => null),
      deleteSpace: vi.fn(() => true),
      reorderSpaces: vi.fn(() => [])
    } as never
    registerSpaceHandlers(mainWindow, store)

    expect(
      handlers.get('spaces:create')!(null, { name: '写作', memberIds: ['project:p1'] })
    ).toMatchObject({
      name: '写作'
    })
    expect(send).toHaveBeenCalledWith('spaces:changed')
    expect(() => handlers.get('spaces:create')!(null, { name: '' })).toThrow(
      'invalid_space_create_args'
    )
    expect(handlers.get('spaces:delete')!(null, { spaceId: 's1' })).toBe(true)
  })
})
