# store/spaces/
> L2 | 父级: src/renderer/src/store/CLAUDE.md

成员清单
space-catalog.ts: Space 只读选择器（activeSpace / activeSpaceRepoIds 含 memo / memberIdForRepo / spacesContainingRepo）。
space-catalog.test.ts: space-catalog 用例——全部态返回 undefined、按成员 id 归属查询、setup-by-repo-id 按 projectHostSetups 引用记忆化。
space-landing.ts: 切换 Space 的落点选择——recency → main worktree → null。
space-landing.test.ts: pickSpaceLandingWorktree 用例——最近访问优先、退化到成员主工作区、空空间/已归档行返回 null。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
