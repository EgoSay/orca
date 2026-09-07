/**
 * [INPUT]: 依赖 @/store 的 activateSpace，@/store/spaces/space-catalog 的 selectActiveSpace，@/components/ui 的 Button，@/i18n/i18n 的 translate，lucide 的 FolderPlus/Layers
 * [OUTPUT]: 对外提供 SpaceEmptyState 组件
 * [POS]: 空 Space 的侧边栏空态（spec §7：空态 + 「添加项目」，不自动跳走）；由 WorktreeList 在无行且有活动空间时替代通用空态渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from 'react'
import { FolderPlus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { selectActiveSpace } from '@/store/spaces/space-catalog'
import { translate } from '@/i18n/i18n'

export function SpaceEmptyState({
  onManageMembers
}: {
  onManageMembers: (spaceId: string) => void
}): React.JSX.Element | null {
  const active = useAppStore(selectActiveSpace)
  const activateSpace = useAppStore((s) => s.activateSpace)
  if (!active) {
    return null
  }
  return (
    <div
      data-worktree-sidebar-container
      data-contextual-tour-target="workspace-list"
      data-space-empty-state=""
      className="relative min-h-0 flex-1"
    >
      <div className="worktree-sidebar-scrollbar flex h-full flex-col overflow-y-auto overflow-x-hidden pl-1 scrollbar-sleek pt-px">
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-[11px] text-muted-foreground">
          <Layers className="size-4 text-muted-foreground/70" />
          <span>
            {translate(
              'auto.components.sidebar.spaces.SpaceEmptyState.title',
              'No projects in this space'
            )}
          </span>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onManageMembers(active.id)}
            className="gap-1.5 border border-border/80 text-[11px]"
          >
            <FolderPlus className="size-3.5" />
            {translate('auto.components.sidebar.spaces.SpaceEmptyState.manage', 'Manage projects…')}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => activateSpace(null)}
            className="text-[11px]"
          >
            {translate('auto.components.sidebar.spaces.SpaceEmptyState.showAll', 'Show all')}
          </Button>
        </div>
      </div>
    </div>
  )
}
