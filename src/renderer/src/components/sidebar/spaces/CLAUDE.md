<!-- src/renderer/src/components/sidebar/spaces/CLAUDE.md -->
# sidebar/spaces/
> L2 | 父级: src/renderer/src/components/sidebar/CLAUDE.md

成员清单
SpaceSwitcher.tsx: 左下角空间切换器——DropdownMenu 向上弹，含全部/管理成员/新建；触发器与菜单项带 data-space-drop-target 供拖拽归属命中；接受可选受控 open/onOpenChange 与 highlightSpaceId（拖拽悬停高亮，由 sidebar/index.tsx 用 hoverSpaceTargetId OR 本地手动开关驱动）。
SpaceSwitcher.test.tsx: SpaceSwitcher 用例——当前空间名/全部态、管理成员禁用态、新建回调、拖拽落点标记、highlightSpaceId 高亮。
SpaceMemberList.tsx: 新建空间与管理成员共用的勾选列表；按 orderProjectIdsByRecency 排序，文件夹仓库标「Folder」，行尾标「也在 …」。
SpaceMemberList.test.tsx: SpaceMemberList 用例——成员归一化 id 列出、Folder 标签、「也在 …」多重归属提示。
SpaceCreateSheet.tsx: 新建空间对话框——名称 + 图标 + 颜色 + 成员一步配完，建完立即 activateSpace；导出 SPACE_ICONS/SPACE_COLORS。
SpaceMemberSheet.tsx: 管理某空间成员的对话框——勾选即调用 setSpaceMembers 写入，无本地草稿。
use-space-dialogs.tsx: 收口 SpaceCreateSheet/SpaceMemberSheet 的开关状态，供 sidebar/index.tsx 挂载。
use-space-keybindings.ts: 全局键位监听——双击 ⌃ 开 SpaceSwitcher（DoubleTap+Ctrl，经 ModifierDoubleTapDetector 复用检测器）、⌘⌥数字直切空间（matchKeybindingDigitIndex）；供 sidebar/index.tsx 挂载。
use-space-keybindings.test.ts: use-space-keybindings 用例——双击 ⌃ 开选择器、数字直切、可编辑目标/终端策略下的免打扰。
space-drop-target.ts: 纯函数 findSpaceDropTarget(root, x, y) 按 data-space-drop-target 命中测试——'' 触发器/空间 id/null；被 project-header-drag 每次 pointermove 调用。
space-drop-target.test.ts: findSpaceDropTarget 的命中测试用例（触发器/菜单项/空白处）。
space-swipe.ts: 纯状态机——createSwipeTracker(threshold+lockMs 去抖去重触发) 与 nextSpaceId(spaces+全部 null 的环形顺序)；被 use-sidebar-space-swipe 消费。
space-swipe.test.ts: createSwipeTracker 阈值/锁定窗口、nextSpaceId 环形顺序（含 全部/null）的用例。
use-sidebar-space-swipe.ts: 侧边栏根容器上监听横向 wheel 两指横滑切空间——≥2 个空间才启用，遇到能横向滚动的祖先（如看板泳道）让路不消费手势，reduced-motion 下不做位移动画；供 sidebar/index.tsx 挂载。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
