/**
 * [INPUT]: 依赖 shared/spaces 的 createSpace/normalizeSpaceName/isSpaceMemberId，shared/space-types
 * [OUTPUT]: 对外提供 SpacePersistenceOperations 类与 SpaceMutationOperations 上下文类型
 * [POS]: main 持久化层的 Space 写路径；形状照抄 project-group-operations.ts，由 project-collection-operations 懒装配
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PersistedState } from '../../../shared/persisted-state-types'
import type { Space, SpaceMemberId, SpaceUpdate } from '../../../shared/space-types'
import { createSpace, isSpaceMemberId, normalizeSpaceName } from '../../../shared/spaces'

export type SpaceMutationOperations = {
  state: PersistedState
  scheduleSave: () => void
}

export class SpacePersistenceOperations {
  constructor(private readonly operations: SpaceMutationOperations) {}

  private get state(): PersistedState {
    return this.operations.state
  }

  private scheduleSave(): void {
    this.operations.scheduleSave()
  }

  getSpaces(): Space[] {
    return [...(this.state.spaces ?? [])].sort(
      (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
    )
  }

  createSpace(input: {
    name: string
    icon?: string | null
    color?: string | null
    memberIds: readonly SpaceMemberId[]
  }): Space {
    let maxOrder = -1
    for (const existing of this.state.spaces ?? []) {
      maxOrder = Math.max(maxOrder, existing.sortOrder)
    }
    const space = createSpace({ ...input, sortOrder: maxOrder + 1 })
    this.state.spaces = [...(this.state.spaces ?? []), space]
    this.scheduleSave()
    return space
  }

  updateSpace(spaceId: string, updates: SpaceUpdate): Space | null {
    const space = (this.state.spaces ?? []).find((entry) => entry.id === spaceId)
    if (!space) {
      return null
    }
    if (updates.name !== undefined) {
      space.name = normalizeSpaceName(updates.name, space.name)
    }
    if (updates.icon !== undefined) {
      space.icon = typeof updates.icon === 'string' && updates.icon.length > 0 ? updates.icon : null
    }
    if (updates.color !== undefined) {
      space.color = typeof updates.color === 'string' ? updates.color : null
    }
    if (updates.sortOrder !== undefined && Number.isFinite(updates.sortOrder)) {
      space.sortOrder = updates.sortOrder
    }
    space.updatedAt = Date.now()
    this.scheduleSave()
    return space
  }

  setSpaceMembers(spaceId: string, memberIds: readonly string[]): Space | null {
    const space = (this.state.spaces ?? []).find((entry) => entry.id === spaceId)
    if (!space) {
      return null
    }
    const seen = new Set<SpaceMemberId>()
    for (const id of memberIds) {
      if (isSpaceMemberId(id)) {
        seen.add(id)
      }
    }
    space.memberIds = [...seen]
    space.updatedAt = Date.now()
    this.scheduleSave()
    return space
  }

  // Why: a space only references projects, so deletion never cascades.
  deleteSpace(spaceId: string): boolean {
    const before = this.state.spaces?.length ?? 0
    this.state.spaces = (this.state.spaces ?? []).filter((space) => space.id !== spaceId)
    if ((this.state.spaces?.length ?? 0) === before) {
      return false
    }
    if (this.state.ui?.activeSpaceId === spaceId) {
      this.state.ui.activeSpaceId = null
    }
    this.scheduleSave()
    return true
  }

  reorderSpaces(orderedIds: readonly string[]): Space[] {
    const rank = new Map(orderedIds.map((id, index) => [id, index]))
    for (const space of this.state.spaces ?? []) {
      const next = rank.get(space.id)
      if (next !== undefined) {
        space.sortOrder = next
      }
    }
    this.scheduleSave()
    return this.getSpaces()
  }
}
