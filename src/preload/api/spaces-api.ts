/**
 * [INPUT]: 依赖 shared/space-types 的 Space/SpaceMemberId/SpaceUpdate 类型（仅类型，无运行时依赖）
 * [OUTPUT]: 对外提供 SpacesApi 类型
 * [POS]: preload 暴露给 renderer 的 Space IPC 签名；由 spaces-bridge.ts 实现，PreloadApi['spaces'] 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { Space, SpaceMemberId, SpaceUpdate } from '../../shared/space-types'

export type SpacesApi = {
  list: () => Promise<Space[]>
  create: (args: {
    name: string
    icon?: string | null
    color?: string | null
    memberIds: readonly SpaceMemberId[]
  }) => Promise<Space>
  update: (args: { spaceId: string; updates: SpaceUpdate }) => Promise<Space | null>
  setMembers: (args: {
    spaceId: string
    memberIds: readonly SpaceMemberId[]
  }) => Promise<Space | null>
  delete: (args: { spaceId: string }) => Promise<boolean>
  reorder: (args: { orderedIds: readonly string[] }) => Promise<Space[]>
  onChanged: (callback: () => void) => () => void
}
