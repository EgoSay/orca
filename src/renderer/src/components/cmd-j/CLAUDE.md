# components/cmd-j/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
palette-space-scope.ts: ⌘J 的空间范围——Space 的 repo id 集合直接作为面板 repoIds 过滤；isSpaceScopeFilter 判断当前过滤是否等于该范围、planSpaceSeed 决定何时（重新）播种、planQueryScopeFilter 在输入查询时放开范围、groupWorktreeItemsByProject 把空查询行按项目分块。
palette-space-scope.test.ts: palette-space-scope 用例。
empty-query-worktree-visibility.ts: buildEmptyQueryWorktreeVisibility——⌘J 空查询可见性；保留 Space/主机筛选，文件夹行遵循归档与设备归属限制，Git 行使用上游仓库类型和休眠判定。
empty-query-worktree-visibility.test.ts: 文件夹、归属、归档、空间筛选和 Git 休眠行为的合并回归。
PaletteFilterChips.tsx（改动）: 接受可选 spaceScope；命中时把整组项目筛选折叠成一个「Space: 名称」chip，清除即清空整个 project 字段而非逐个 toggle。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
