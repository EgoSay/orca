/**
 * [INPUT]: 依赖 ./titlebar-path-siblings 的 buildTitlebarPath，@/store 的 activateSpace/setActiveWorktree，store/spaces/space-landing 的 pickSpaceLandingWorktree，@/components/ui 的 DropdownMenu，components/sidebar/spaces/SpaceSwitcher 的 SpaceDot
 * [OUTPUT]: 对外提供 TitlebarPathBar 组件
 * [POS]: 标题栏的导航仪器（Xcode jump bar）：Space › Project › Worktree 每段是兄弟选择器；与左下角切换器并存
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React, { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store'
import { pickSpaceLandingWorktree } from '@/store/spaces/space-landing'
import { SpaceDot } from '../components/sidebar/spaces/SpaceSwitcher'
import { ALL_SPACE_CRUMB_ID, buildTitlebarPath, type TitlebarCrumb } from './titlebar-path-siblings'

function Crumb({
  crumb,
  dot,
  onPick
}: {
  crumb: TitlebarCrumb
  /** Only the space segment carries a colored identity dot, matching SpaceSwitcher. */
  dot?: boolean
  onPick: (id: string) => void
}): React.JSX.Element {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-[22px] max-w-[150px] items-center gap-1 rounded-md px-1.5 text-[11.5px] text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          {dot ? <SpaceDot color={crumb.color} /> : null}
          <span className="truncate">{crumb.label}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" sideOffset={4} className="w-56">
        {crumb.siblings.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => onPick(s.id)}
            className={s.current ? 'bg-accent' : undefined}
          >
            <span className="truncate">{s.label}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{s.detail}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TitlebarPathBar(): React.JSX.Element | null {
  // Why: useShallow only compares the top level of what the selector returns, but
  // buildTitlebarPath allocates fresh space/project/worktree objects on every call —
  // the shallow compare never matches, so the bar re-rendered on every store write.
  // Selecting the raw fields individually gives zustand stable references to diff,
  // and useMemo below only recomputes the derived path when one of them changes.
  const spaces = useAppStore((s) => s.spaces)
  const activeSpaceId = useAppStore((s) => s.activeSpaceId)
  // Why: the web client's fallback spaces API never hydrates — no space crumb there.
  const spacesHydrated = useAppStore((s) => s.spacesHydrated)
  const repos = useAppStore((s) => s.repos)
  const projectHostSetups = useAppStore((s) => s.projectHostSetups)
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const lastVisitedAtByWorktreeId = useAppStore((s) => s.lastVisitedAtByWorktreeId)
  const activateSpace = useAppStore((s) => s.activateSpace)
  const setActiveWorktree = useAppStore((s) => s.setActiveWorktree)
  const path = useMemo(
    () =>
      buildTitlebarPath({
        spaces,
        activeSpaceId,
        repos,
        projectHostSetups,
        activeWorktreeId,
        worktreesByRepo
      }),
    [spaces, activeSpaceId, repos, projectHostSetups, activeWorktreeId, worktreesByRepo]
  )
  if (!path) {
    return null
  }
  const pickProject = (repoId: string): void => {
    const target = pickSpaceLandingWorktree({
      worktrees: worktreesByRepo[repoId] ?? [],
      memberRepoIds: new Set([repoId]),
      lastVisitedAtByWorktreeId
    })
    if (target) {
      setActiveWorktree(target.id, target.hostId)
    }
  }
  return (
    <div
      className="mr-2 flex h-full shrink-0 items-center gap-0.5 border-r border-border pr-2"
      data-titlebar-path-bar=""
      // Why: the titlebar is an OS drag region; without no-drag these buttons never receive clicks.
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {spacesHydrated ? (
        <>
          <Crumb
            crumb={path.space}
            dot
            onPick={(id) => activateSpace(id === ALL_SPACE_CRUMB_ID ? null : id)}
          />
          <span className="px-0.5 text-[11px] text-muted-foreground">›</span>
        </>
      ) : null}
      <Crumb crumb={path.project} onPick={pickProject} />
      <span className="px-0.5 text-[11px] text-muted-foreground">›</span>
      <Crumb crumb={path.worktree} onPick={(id) => setActiveWorktree(id)} />
    </div>
  )
}
