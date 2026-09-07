/**
 * [INPUT]: 依赖 ./space-types 的 Space/SpaceMemberId
 * [OUTPUT]: 对外提供 createSpace、normalizeSpaceName、normalizeSpaces、normalizeActiveSpaceId、isSpaceMemberId
 * [POS]: Space 记录的生命周期纯函数；main 持久化与 renderer 共用，形状照抄 project-groups.ts
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Space, SpaceMemberId } from './space-types'

const DEFAULT_SPACE_NAME = 'Untitled space'

function createSpaceId(): string {
  const randomUUID = globalThis.crypto?.randomUUID
  if (randomUUID) {
    return randomUUID.call(globalThis.crypto)
  }
  return `space-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const SPACE_MEMBER_PREFIXES = ['project:', 'repo:'] as const

export function isSpaceMemberId(value: unknown): value is SpaceMemberId {
  return (
    typeof value === 'string' &&
    SPACE_MEMBER_PREFIXES.some((prefix) => value.startsWith(prefix) && value.length > prefix.length)
  )
}

export function normalizeSpaceName(name: string, fallback = DEFAULT_SPACE_NAME): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeMemberIds(value: unknown): SpaceMemberId[] {
  if (!Array.isArray(value)) {
    return []
  }
  const seen = new Set<SpaceMemberId>()
  for (const candidate of value) {
    if (isSpaceMemberId(candidate)) {
      seen.add(candidate)
    }
  }
  return [...seen]
}

export function createSpace(input: {
  name: string
  icon?: string | null
  color?: string | null
  memberIds?: readonly SpaceMemberId[]
  sortOrder: number
  now?: number
}): Space {
  const now = input.now ?? Date.now()
  return {
    id: createSpaceId(),
    name: normalizeSpaceName(input.name),
    icon: input.icon ?? null,
    color: input.color ?? null,
    memberIds: normalizeMemberIds(input.memberIds ?? []),
    sortOrder: input.sortOrder,
    createdAt: now,
    updatedAt: now
  }
}

export function normalizeSpaces(value: unknown): Space[] {
  if (!Array.isArray(value)) {
    return []
  }
  const spaces: Space[] = []
  const seen = new Set<string>()
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') {
      continue
    }
    const raw = candidate as Partial<Space>
    if (typeof raw.id !== 'string' || raw.id.length === 0 || seen.has(raw.id)) {
      continue
    }
    seen.add(raw.id)
    const now = Date.now()
    spaces.push({
      id: raw.id,
      name: normalizeSpaceName(typeof raw.name === 'string' ? raw.name : ''),
      icon: typeof raw.icon === 'string' && raw.icon.length > 0 ? raw.icon : null,
      color: typeof raw.color === 'string' ? raw.color : null,
      memberIds: normalizeMemberIds(raw.memberIds),
      sortOrder:
        typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0,
      createdAt:
        typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : now,
      updatedAt:
        typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : now
    })
  }
  spaces.sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
  )
  return spaces
}

/** null is the「全部」pseudo-space; an id that no longer exists degrades to it. */
export function normalizeActiveSpaceId(
  value: unknown,
  spaces: readonly Pick<Space, 'id'>[]
): string | null {
  return typeof value === 'string' && spaces.some((space) => space.id === value) ? value : null
}
