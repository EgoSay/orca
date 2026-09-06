/**
 * [INPUT]: 依赖 @/store 的 repos/projectHostSetups/spaces/worktreesByRepo，store/spaces/space-catalog 的 selectSpaceMemberIdForRepo，new-workspace/use-recent-project-ids 的 orderProjectIdsByRecency
 * [OUTPUT]: 对外提供 SpaceMemberList 组件
 * [POS]: 新建空间与管理成员共用的勾选列表；行尾标「也在 …」
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React, { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import type { SpaceMemberId } from '../../../../../shared/space-types'
import { selectSpaceMemberIdForRepo } from '@/store/spaces/space-catalog'
import { orderProjectIdsByRecency } from '../../new-workspace/use-recent-project-ids'

export function SpaceMemberList({
  selected,
  onToggle,
  excludeSpaceId
}: {
  selected: ReadonlySet<SpaceMemberId>
  onToggle: (memberId: SpaceMemberId, on: boolean) => void
  excludeSpaceId?: string
}): React.JSX.Element {
  const repos = useAppStore((s) => s.repos)
  const setups = useAppStore((s) => s.projectHostSetups)
  const spaces = useAppStore((s) => s.spaces)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)

  const rows = useMemo(() => {
    const recentProjectIds = orderProjectIdsByRecency(Object.values(worktreesByRepo).flat())
    const rank = new Map(recentProjectIds.map((id, i) => [id, i]))
    const seen = new Set<SpaceMemberId>()
    const list: { memberId: SpaceMemberId; label: string; rank: number; also: string[] }[] = []
    for (const repo of repos) {
      const memberId = selectSpaceMemberIdForRepo({ projectHostSetups: setups }, repo.id)
      if (seen.has(memberId)) {
        continue
      }
      seen.add(memberId)
      const projectId = memberId.startsWith('project:') ? memberId.slice('project:'.length) : ''
      list.push({
        memberId,
        label: repo.displayName,
        rank: rank.get(projectId) ?? Number.POSITIVE_INFINITY,
        also: spaces
          .filter((s) => s.id !== excludeSpaceId && s.memberIds.includes(memberId))
          .map((s) => s.name)
      })
    }
    return list.sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label))
  }, [excludeSpaceId, repos, setups, spaces, worktreesByRepo])

  return (
    <div className="scrollbar-sleek -mx-1.5 max-h-52 overflow-auto px-1.5">
      {rows.map((row) => (
        <label
          key={row.memberId}
          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent"
        >
          <Checkbox
            aria-label={row.label}
            checked={selected.has(row.memberId)}
            onCheckedChange={(on) => onToggle(row.memberId, on === true)}
          />
          <span className="truncate">{row.label}</span>
          {row.also.length > 0 ? (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {translate(
                'auto.components.sidebar.spaces.SpaceMemberList.alsoIn',
                'Also in {{value0}}',
                { value0: row.also.join('、') }
              )}
            </span>
          ) : null}
        </label>
      ))}
    </div>
  )
}
