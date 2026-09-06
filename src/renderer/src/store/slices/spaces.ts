/**
 * [INPUT]: 依赖 window.api.spaces（preload），store/spaces/space-catalog 与 space-landing，既有 setActiveWorktree
 * [OUTPUT]: 对外提供 SpacesSlice 类型与 createSpacesSlice
 * [POS]: Space 的 renderer 状态与动作；activeSpaceId 通过 window.api.ui.set 持久化，spaces 通过 IPC 持久化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { StateCreator } from 'zustand'
import type { Space, SpaceMemberId, SpaceUpdate } from '../../../../shared/space-types'
import type { AppState } from '../types'
import { selectActiveSpaceRepoIds } from '../spaces/space-catalog'
import { pickSpaceLandingWorktree } from '../spaces/space-landing'

export type SpacesSlice = {
  spaces: readonly Space[]
  activeSpaceId: string | null
  spacesHydrated: boolean
  loadSpaces: () => Promise<void>
  createSpace: (input: {
    name: string
    icon?: string | null
    color?: string | null
    memberIds: readonly SpaceMemberId[]
  }) => Promise<Space | null>
  updateSpace: (spaceId: string, updates: SpaceUpdate) => Promise<void>
  deleteSpace: (spaceId: string) => Promise<void>
  setSpaceMembers: (spaceId: string, memberIds: readonly SpaceMemberId[]) => Promise<void>
  addSpaceMember: (spaceId: string, memberId: SpaceMemberId) => Promise<void>
  removeSpaceMember: (spaceId: string, memberId: SpaceMemberId) => Promise<void>
  reorderSpaces: (orderedIds: readonly string[]) => Promise<void>
  /** Moves the active-workspace pointer into the space; null = 全部. */
  activateSpace: (spaceId: string | null) => void
}

export const createSpacesSlice: StateCreator<AppState, [], [], SpacesSlice> = (set, get) => ({
  spaces: [],
  activeSpaceId: null,
  spacesHydrated: false,

  loadSpaces: async () => {
    try {
      const spaces = await window.api.spaces.list()
      set({ spaces, spacesHydrated: true })
    } catch (err) {
      console.error('Failed to load spaces:', err)
    }
  },

  createSpace: async (input) => {
    try {
      const space = await window.api.spaces.create(input)
      set((s) => ({ spaces: [...s.spaces, space] }))
      return space
    } catch (err) {
      console.error('Failed to create space:', err)
      return null
    }
  },

  updateSpace: async (spaceId, updates) => {
    const updated = await window.api.spaces.update({ spaceId, updates })
    if (updated) {
      set((s) => ({ spaces: s.spaces.map((space) => (space.id === spaceId ? updated : space)) }))
    }
  },

  deleteSpace: async (spaceId) => {
    const deleted = await window.api.spaces.delete({ spaceId })
    if (!deleted) {
      return
    }
    set((s) => ({ spaces: s.spaces.filter((space) => space.id !== spaceId) }))
    if (get().activeSpaceId === spaceId) {
      get().activateSpace(null)
    }
  },

  setSpaceMembers: async (spaceId, memberIds) => {
    const updated = await window.api.spaces.setMembers({ spaceId, memberIds })
    if (updated) {
      set((s) => ({ spaces: s.spaces.map((space) => (space.id === spaceId ? updated : space)) }))
    }
  },

  addSpaceMember: async (spaceId, memberId) => {
    const space = get().spaces.find((entry) => entry.id === spaceId)
    if (!space || space.memberIds.includes(memberId)) {
      return
    }
    await get().setSpaceMembers(spaceId, [...space.memberIds, memberId])
  },

  removeSpaceMember: async (spaceId, memberId) => {
    const space = get().spaces.find((entry) => entry.id === spaceId)
    if (!space) {
      return
    }
    await get().setSpaceMembers(
      spaceId,
      space.memberIds.filter((id) => id !== memberId)
    )
  },

  reorderSpaces: async (orderedIds) => {
    const spaces = await window.api.spaces.reorder({ orderedIds })
    set({ spaces })
  },

  activateSpace: (spaceId) => {
    set({ activeSpaceId: spaceId })
    window.api.ui.set({ activeSpaceId: spaceId }).catch(console.error)
    const state = get()
    const memberRepoIds = selectActiveSpaceRepoIds(state)
    if (memberRepoIds === undefined) {
      return
    }
    const target = pickSpaceLandingWorktree({
      worktrees: state.allWorktrees(),
      memberRepoIds,
      lastVisitedAtByWorktreeId: state.lastVisitedAtByWorktreeId
    })
    // Why: an empty space keeps the current workspace; the guest row (Task 7) covers it.
    if (target && target.id !== state.activeWorktreeId) {
      state.setActiveWorktree(target.id, target.hostId)
    }
  }
})
