# components/sidebar/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
spaces/: 见 spaces/CLAUDE.md
project-header-drag-autoscroll.ts: useRepoHeaderDragAutoscroll——项目表头拖拽时的 RAF 自动滚动循环，从 project-header-drag.ts 拆出以保持后者专注于拖拽/会话/命中测试编排。
project-header-drag-contract.test.ts: resolveEndDragOutcome 用例——外部落点（空间）优先于侧边栏重排，SPACE_SWITCHER_DROP_TARGET 触发器为 no-op。
visible-worktree-lineage-ancestors.ts: addVisibleLineageAncestors——visible-worktrees 的血缘祖先注入，拆出以保持 visible-worktrees.ts 低于 max-lines（同 sidebar-filter-actions.ts 先例）。
project-header-drag-contract.ts（改动）: 新增 SpaceDropTargetId 类型（string | null，触发器哨兵由 spaces/space-drop-target 的 SPACE_SWITCHER_DROP_TARGET 命名）、RepoDragState.hoverSpaceTargetId、ProjectHeaderDragSession.latestPointerX/externalTargetId、idleRepoDragState、resolveEndDragOutcome——外部（空间）落点与侧边栏重排落点的合流判定。
project-header-drag.ts（改动）: 消费 resolveEndDragOutcome 与 findSpaceDropTarget，drop 落在空间时调用 onDropOnSpace 而非走原有 commitProjectHeaderDragDrop 重排；自动滚动改用拆出的 useRepoHeaderDragAutoscroll。
project-header-drag-start.ts（改动）: 会话初始状态补 latestPointerX/externalTargetId: null。
project-header-drag-commit.test.ts（改动）: 配套会话新字段的测试 fixture。
project-header-drag.test.ts（改动）: 补充落在空间目标时的拖拽用例。
visible-worktrees.ts（改动）: 新增 activeSpaceRepoIds 过滤（undefined ≡ 全部，与 host 过滤对称处理为存在性判断而非模式开关）；lineage 祖先注入逻辑迁出到 visible-worktree-lineage-ancestors.ts。
visible-worktrees.test.ts（改动）: 补 activeSpaceRepoIds 用例——按成员仓库过滤、undefined 时保留全部、forcedVisibleWorktreeIds 强制可见不受空间过滤影响。
WorktreeList.tsx（改动）: 透传 activeSpaceRepoIds/onSpaceDropHoverChange/handleRemoveProjectFromSpace 到子组件；无行时按「有活动空间且无过滤」在 SpaceEmptyState 与通用空态之间二选一。
WorktreeList.space-empty-state.test.ts: 空 Space 空态与通用空态的取舍用例。
WorktreeCard.tsx（改动）: 新增 isGuestInActiveSpace 透传给 worktree-card-header。
worktree-card-header.tsx（改动）: isGuestInActiveSpace 为真时渲染「Guest」徽标（该工作区所属项目不是当前空间的直接成员）。
worktree-card-model.ts（改动）: WorktreeCardProps 新增 isGuestInActiveSpace?: boolean。
SidebarToolbar.tsx（改动）: 挂载 SpaceSwitcher，透传 onManageSpaceMembers/onCreateSpace/spaceSwitcherOpen/onSpaceSwitcherOpenChange/highlightSpaceId。
SidebarToolbar.test.tsx（改动）: 配套 SpaceSwitcher 挂载用例。
Sidebar.test.tsx（改动）: 配套空间相关的渲染用例。
index.tsx（改动）: 挂载 useSpaceDialogs/useSpaceKeybindings/useSidebarSpaceSwipe；用 hoverSpaceTargetId OR 手动开关驱动 SpaceSwitcher 受控 open，实现拖拽悬停时强制展开高亮；openPicker 先 setSidebarOpen(true) 再置手动开关，侧边栏关闭时复位该开关。
add-repo-store-upsert.ts（改动）: 新增仓库时若存在 activeSpaceId，同步 addSpaceMember——就近原则，新项目默认归入当前空间。
rendered-sidebar-worktree-order.ts（改动）: computeRenderedSidebarWorktrees 新增 selectActiveSpaceRepoIds(state) 与 state.repos 入参。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
