/**
 * [INPUT]: 依赖 ./palette-filter-options 的 PaletteFilterModel，shared/space-types 的 Space，./palette-filter 的 PaletteFilterState
 * [OUTPUT]: 对外提供 spaceToPaletteProjectKeys、groupWorktreeItemsByProject、isSpaceScopeFilter
 * [POS]: ⌘J 的空间范围：把 Space 成员映射成既有 projectKeys 过滤，判断当前过滤是否等于该范围，并把空查询行按项目分块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Space } from '../../../../shared/space-types'
import type { PaletteFilterModel } from './palette-filter-options'
import type { PaletteFilterState } from './palette-filter'

// Why: a SpaceMemberId is the same lane key the palette already filters on,
// minus the render-time `::setup:` split — so expand by prefix, never re-derive.
export function spaceToPaletteProjectKeys(
  space: Pick<Space, 'memberIds'>,
  model: Pick<PaletteFilterModel, 'projects'>
): string[] {
  const keys: string[] = []
  for (const option of model.projects) {
    for (const memberId of space.memberIds) {
      if (option.id === memberId || option.id.startsWith(`${memberId}::setup:`)) {
        keys.push(option.id)
        break
      }
    }
  }
  return keys
}

export function groupWorktreeItemsByProject<T>(
  items: readonly T[],
  getProjectKey: (item: T) => string
): T[] {
  const blocks = new Map<string, T[]>()
  for (const item of items) {
    const key = getProjectKey(item)
    const block = blocks.get(key)
    if (block) {
      block.push(item)
    } else {
      blocks.set(key, [item])
    }
  }
  return [...blocks.values()].flat()
}

// Why: order-insensitive — the seed effect sorts projectKeys, but a stale
// chip toggle could still leave the same set in a different order.
export function isSpaceScopeFilter(
  filter: Pick<PaletteFilterState, 'projectKeys'>,
  spaceKeys: readonly string[]
): boolean {
  if (filter.projectKeys.length === 0 || spaceKeys.length === 0) {
    return false
  }
  if (filter.projectKeys.length !== spaceKeys.length) {
    return false
  }
  const filterKeySet = new Set(filter.projectKeys)
  return spaceKeys.every((key) => filterKeySet.has(key))
}
