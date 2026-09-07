import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestStore } from './store-test-helpers'

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
