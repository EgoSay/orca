# store/spaces/
> L2 | 父级: src/renderer/src/store/CLAUDE.md

成员清单
space-catalog.ts: Space 只读选择器（activeSpace / activeSpaceRepoIds 含 memo / memberIdForRepo / spacesContainingRepo）。
space-catalog.test.ts: space-catalog 用例——全部态返回 undefined、按成员 id 归属查询、setup-by-repo-id 按 projectHostSetups 引用记忆化。
space-landing.ts: 切换 Space 的落点选择——recency → 最近活跃项目的 main worktree → 最近活跃成员 → null。
space-landing.test.ts: pickSpaceLandingWorktree 用例——最近访问优先、退化到最近活跃项目的主工作区、无主工作区时取最近活跃成员、空空间/已归档行返回 null。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
