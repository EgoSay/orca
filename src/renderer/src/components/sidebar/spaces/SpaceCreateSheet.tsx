/**
 * [INPUT]: 依赖 @/components/ui 的 Dialog/Input/Button，./SpaceMemberList，@/store 的 createSpace/activateSpace
 * [OUTPUT]: 对外提供 SpaceCreateSheet 组件与 SPACE_COLORS/SPACE_ICONS 常量
 * [POS]: 名称 + 图标 + 颜色 + 成员一步配完；建完立即 activateSpace
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import type { SpaceMemberId } from '../../../../../shared/space-types'
import { SpaceMemberList } from './SpaceMemberList'

export const SPACE_COLORS = [
  '#1447e6',
  '#8b5cf6',
  '#0d9488',
  '#c2410c',
  '#be123c',
  '#4d7c0f'
] as const
export const SPACE_ICONS = ['⚙️', '✍️', '🏢', '📚', '🧪', '🎧', '🛠️', '🌱'] as const

export function SpaceCreateSheet({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}): React.JSX.Element {
  const createSpace = useAppStore((s) => s.createSpace)
  const activateSpace = useAppStore((s) => s.activateSpace)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string | null>(SPACE_ICONS[0])
  const [color, setColor] = useState<string>(SPACE_COLORS[0])
  const [members, setMembers] = useState<ReadonlySet<SpaceMemberId>>(new Set())

  const submit = async (): Promise<void> => {
    const space = await createSpace({ name: name.trim(), icon, color, memberIds: [...members] })
    if (!space) {
      return
    }
    activateSpace(space.id)
    onOpenChange(false)
    setName('')
    setMembers(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {translate('auto.components.sidebar.spaces.SpaceCreateSheet.title', 'New space')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={translate(
              'auto.components.sidebar.spaces.SpaceCreateSheet.namePlaceholder',
              'Writing / Client Acme / Papers'
            )}
            aria-label={translate('auto.components.sidebar.spaces.SpaceCreateSheet.name', 'Name')}
          />
          <div className="flex flex-wrap gap-1">
            {SPACE_ICONS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={icon === candidate}
                onClick={() => setIcon(candidate)}
                className="size-7 rounded-md border border-transparent text-base aria-pressed:border-foreground aria-pressed:bg-accent"
              >
                {candidate}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {SPACE_COLORS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={color === candidate}
                onClick={() => setColor(candidate)}
                aria-label={candidate}
                style={{ background: candidate }}
                className="size-5 rounded-full border-2 border-transparent aria-pressed:border-foreground"
              />
            ))}
          </div>
          <SpaceMemberList
            selected={members}
            onToggle={(memberId, on) =>
              setMembers((prev) => {
                const next = new Set(prev)
                if (on) {
                  next.add(memberId)
                } else {
                  next.delete(memberId)
                }
                return next
              })
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {translate('auto.components.sidebar.spaces.SpaceCreateSheet.cancel', 'Cancel')}
          </Button>
          <Button type="button" disabled={name.trim() === ''} onClick={() => void submit()}>
            {translate(
              'auto.components.sidebar.spaces.SpaceCreateSheet.createAndSwitch',
              'Create and switch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
