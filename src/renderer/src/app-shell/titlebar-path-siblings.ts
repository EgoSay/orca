/**
 * [INPUT]: 依赖 store/spaces/space-catalog 的 selectActiveSpace/selectActiveSpaceRepoIds，AppState 的 repos/worktreesByRepo/activeWorktreeId，i18n/i18n 的 translate
 * [OUTPUT]: 对外提供 buildTitlebarPath、TitlebarCrumb 类型、ALL_SPACE_CRUMB_ID
 * [POS]: 路径栏三段的兄弟列表派生（纯函数）；TitlebarPathBar 只负责渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { AppState } from '@/store/types'
import { selectActiveSpace, selectActiveSpaceRepoIds } from '@/store/spaces/space-catalog'
import { translate } from '@/i18n/i18n'

export const ALL_SPACE_CRUMB_ID = 'all'

export type TitlebarCrumb = {
  label: string
  color: string | null
  siblings: { id: string; label: string; detail: string; current: boolean }[]
}

type PathState = Pick<
  AppState,
  | 'spaces'
  | 'activeSpaceId'
  | 'repos'
  | 'projectHostSetups'
  | 'activeWorktreeId'
  | 'worktreesByRepo'
>

export function buildTitlebarPath(
  state: PathState
): { space: TitlebarCrumb; project: TitlebarCrumb; worktree: TitlebarCrumb } | null {
  const active = state.activeWorktreeId
    ? Object.values(state.worktreesByRepo)
        .flat()
        .find((w) => w.id === state.activeWorktreeId)
    : undefined
  if (!active) {
    return null
  }
  const allLabel = translate('auto.app.shell.TitlebarPathBar.all', 'All')
  const activeSpace = selectActiveSpace(state)
  const memberRepoIds = selectActiveSpaceRepoIds(state)
  const repoById = new Map(state.repos.map((repo) => [repo.id, repo]))
  const repo = repoById.get(active.repoId)

  const space: TitlebarCrumb = {
    label: activeSpace?.name ?? allLabel,
    color: activeSpace?.color ?? null,
    siblings: [
      ...state.spaces.map((s) => ({
        id: s.id,
        label: s.name,
        detail: `${s.memberIds.length}`,
        current: s.id === state.activeSpaceId
      })),
      {
        id: ALL_SPACE_CRUMB_ID,
        label: allLabel,
        detail: `${state.repos.length}`,
        current: state.activeSpaceId === null
      }
    ]
  }
  // Why: the current project stays listed even while it is a guest of the space.
  const projectRepos = state.repos.filter(
    (r) => memberRepoIds === undefined || memberRepoIds.has(r.id) || r.id === active.repoId
  )
  const project: TitlebarCrumb = {
    label: repo?.displayName ?? active.repoId,
    color: null,
    siblings: projectRepos.map((r) => ({
      id: r.id,
      label: r.displayName,
      detail: `${(state.worktreesByRepo[r.id] ?? []).filter((w) => !w.isArchived).length}`,
      current: r.id === active.repoId
    }))
  }
  const worktree: TitlebarCrumb = {
    label: active.displayName,
    color: null,
    siblings: (state.worktreesByRepo[active.repoId] ?? [])
      .filter((w) => !w.isArchived)
      .map((w) => ({
        id: w.id,
        label: w.displayName,
        detail: w.branch,
        current: w.id === active.id
      }))
  }
  return { space, project, worktree }
}
