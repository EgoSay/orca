/**
 * [INPUT]: 依赖 react，./SpaceCreateSheet，./SpaceMemberSheet
 * [OUTPUT]: 对外提供 useSpaceDialogs
 * [POS]: 把两个对话框的开关状态收口成一个 hook，供 sidebar/index.tsx 挂载并把回调传给 SidebarToolbar
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React, { useCallback, useState } from 'react'
import { SpaceCreateSheet } from './SpaceCreateSheet'
import { SpaceMemberSheet } from './SpaceMemberSheet'

export function useSpaceDialogs(): {
  openCreate: () => void
  openMembers: (spaceId: string) => void
  dialogs: React.ReactNode
} {
  const [createOpen, setCreateOpen] = useState(false)
  const [membersSpaceId, setMembersSpaceId] = useState<string | null>(null)
  const openCreate = useCallback(() => setCreateOpen(true), [])
  const openMembers = useCallback((spaceId: string) => setMembersSpaceId(spaceId), [])
  const dialogs = (
    <>
      <SpaceCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
      <SpaceMemberSheet spaceId={membersSpaceId} onClose={() => setMembersSpaceId(null)} />
    </>
  )
  return { openCreate, openMembers, dialogs }
}
