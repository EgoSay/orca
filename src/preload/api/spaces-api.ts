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
