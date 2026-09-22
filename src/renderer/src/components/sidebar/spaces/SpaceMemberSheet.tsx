/**
 * [INPUT]: 依赖 @/components/ui 的 Dialog/Button，./SpaceMemberList，@/store 的 spaces/setSpaceMembers
 * [OUTPUT]: 对外提供 SpaceMemberSheet 组件
 * [POS]: 批量管理某个空间的成员；勾选即写入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { SpaceMemberList } from './SpaceMemberList'

export function SpaceMemberSheet({
  spaceId,
  onClose
}: {
  spaceId: string | null
  onClose: () => void
}): React.JSX.Element {
  const space = useAppStore((s) => s.spaces.find((entry) => entry.id === spaceId) ?? null)
  const setSpaceMembers = useAppStore((s) => s.setSpaceMembers)
  return (
    <Dialog open={space !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {translate(
              'auto.components.sidebar.spaces.SpaceMemberSheet.title',
              'Projects in {{value0}}',
              { value0: space?.name ?? '' }
            )}
          </DialogTitle>
        </DialogHeader>
        {space ? (
          <SpaceMemberList
            selected={new Set(space.memberIds)}
            excludeSpaceId={space.id}
            onToggle={(memberId, on) =>
              void setSpaceMembers(
                space.id,
                on
                  ? [...space.memberIds, memberId]
                  : space.memberIds.filter((id) => id !== memberId)
              )
            }
          />
        ) : null}
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {translate('auto.components.sidebar.spaces.SpaceMemberSheet.done', 'Done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
