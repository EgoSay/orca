/**
 * [INPUT]: 依赖 @/store 的 spaces/activeSpaceId/activateSpace，@/store/spaces/space-catalog 的 selectActiveSpace，@/hooks/useShortcutLabel 的 useShortcutKeyComboDetails，./SpaceDot 的 SpaceDot，@/components/ui 的 Button/DropdownMenu，@/lib/utils 的 cn，lucide 的 ChevronDown/Plus/Settings2
 * [OUTPUT]: 对外提供 SpaceSwitcher 组件（含可选受控 open/onOpenChange 与 highlightSpaceId，供拖拽悬停驱动）
 * [POS]: SidebarToolbar 左簇的空间仪器：切换、新建、管理成员、拖拽落点；路径栏（TitlebarPathBar）是导航仪器，两者并存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from 'react'
import { ChevronDown, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { selectActiveSpace } from '@/store/spaces/space-catalog'
import type { SpaceDropTargetId } from '../project-header-drag-contract'
import { SPACE_SWITCHER_DROP_TARGET } from './space-drop-target'
import { SpaceDot } from './SpaceDot'
import { useShortcutKeyComboDetails } from '@/hooks/useShortcutLabel'

export function SpaceSwitcher({
  onManageMembers,
  onCreateSpace,
  open,
  onOpenChange,
  highlightSpaceId
}: {
  onManageMembers: (spaceId: string) => void
  onCreateSpace: () => void
  /** Uncontrolled when omitted; Task 12's drag hover drives it explicitly. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  highlightSpaceId?: SpaceDropTargetId
}): React.JSX.Element {
  const spaces = useAppStore((s) => s.spaces)
  const activeSpaceId = useAppStore((s) => s.activeSpaceId)
  const activateSpace = useAppStore((s) => s.activateSpace)
  const active = useAppStore(selectActiveSpace)
  const allLabel = translate('auto.components.sidebar.spaces.SpaceSwitcher.all', 'All')
  const label = active?.name ?? allLabel
  const controlledOpenProps = open === undefined ? {} : { open, onOpenChange }
  // Why: `space.selectByIndex` has no default outside macOS and is rebindable —
  // never hardcode ⌘⌥. Empty modifiers mean unbound, so render no hint at all.
  const indexShortcutModifiers =
    useShortcutKeyComboDetails('space.selectByIndex')[0]?.keys.slice(0, -1) ?? []

  return (
    <DropdownMenu modal={false} {...controlledOpenProps}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          data-space-drop-target={SPACE_SWITCHER_DROP_TARGET}
          aria-label={translate(
            'auto.components.sidebar.spaces.SpaceSwitcher.switch',
            'Switch space, current {{value0}}',
            { value0: label }
          )}
          className="h-6 max-w-[150px] gap-1.5 px-1.5 text-xs font-medium"
        >
          <SpaceDot color={active?.color ?? null} />
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
        <DropdownMenuLabel>
          {translate('auto.components.sidebar.spaces.SpaceSwitcher.spaces', 'Spaces')}
        </DropdownMenuLabel>
        {spaces.map((space, index) => (
          <DropdownMenuItem
            key={space.id}
            data-space-drop-target={space.id}
            onSelect={() => activateSpace(space.id)}
            className={cn(
              space.id === activeSpaceId && 'bg-accent',
              space.id === highlightSpaceId && 'ring-1 ring-inset ring-ring'
            )}
          >
            <span className="w-4 text-center">{space.icon ?? ''}</span>
            <SpaceDot color={space.color} />
            <span className="truncate">{space.name}</span>
            {index < 9 && indexShortcutModifiers.length > 0 ? (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {indexShortcutModifiers.join('')}
                {index + 1}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => activateSpace(null)}
          className={activeSpaceId === null ? 'bg-accent' : undefined}
        >
          <span className="w-4 text-center">∗</span>
          <SpaceDot color={null} />
          {allLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!active} onSelect={() => active && onManageMembers(active.id)}>
          <Settings2 className="size-3.5" />
          {active
            ? translate(
                'auto.components.sidebar.spaces.SpaceSwitcher.manage',
                'Manage projects in {{value0}}…',
                { value0: active.name }
              )
            : translate(
                'auto.components.sidebar.spaces.SpaceSwitcher.manageAllDisabled',
                'All has no members to manage'
              )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCreateSpace}>
          <Plus className="size-3.5" />
          {translate('auto.components.sidebar.spaces.SpaceSwitcher.create', 'New space…')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
