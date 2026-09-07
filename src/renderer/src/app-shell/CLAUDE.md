# app-shell/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
TitlebarPathBar.tsx: 标题栏的导航仪器（Xcode jump bar）——Space › Project › Worktree 每段是兄弟选择器；与左下角 SpaceSwitcher 并存。
TitlebarPathBar.test.tsx: TitlebarPathBar 用例——spacesHydrated 才渲染 Space 段、worktree 段的主机限定选择。
titlebar-path-siblings.ts: buildTitlebarPath 纯函数——路径栏三段的兄弟列表派生，TitlebarPathBar 只负责渲染。
titlebar-path-siblings.test.ts: buildTitlebarPath 用例。
TitlebarMainStrip.tsx（改动）: workspaceChromeActive 时挂载 TitlebarPathBar。
startup-actions-selector.ts（改动）: StartupActions 新增 loadSpaces，纳入记忆化选择器。
startup-actions-selector.test.ts（改动）: 配套 loadSpaces mock。
use-app-startup-hydration.ts（改动）: 启动时序中加入 fetch-spaces 步骤，调用 actions.loadSpaces()。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
