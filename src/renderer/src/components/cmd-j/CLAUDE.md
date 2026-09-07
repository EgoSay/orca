# components/cmd-j/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
palette-space-scope.ts: ⌘J 的空间范围——spaceToPaletteProjectKeys 把 Space 成员映射成 projectKeys 过滤、isSpaceScopeFilter 判断当前过滤是否等于该范围、planSpaceSeed 决定何时（重新）播种、groupWorktreeItemsByProject 把空查询行按项目分块。
palette-space-scope.test.ts: palette-space-scope 用例。
empty-query-worktree-visibility.ts: buildEmptyQueryWorktreeVisibility——⌘J 空查询行的可见性谓词（归档/过滤谓词/各隐藏开关/休眠判定），从 use-worktree-jump-palette-worktrees 抽出以守住 300 行上限。
PaletteFilterChips.tsx（改动）: 接受可选 spaceScope；命中时把整组项目筛选折叠成一个「Space: 名称」chip，清除即清空整个 project 字段而非逐个 toggle。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
