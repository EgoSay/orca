<!-- src/renderer/src/components/sidebar/spaces/CLAUDE.md -->
# sidebar/spaces/
> L2 | 父级: src/renderer/src/components/sidebar/CLAUDE.md

成员清单
SpaceSwitcher.tsx: 左下角空间切换器——DropdownMenu 向上弹，含全部/管理成员/新建；触发器与菜单项带 data-space-drop-target 供拖拽归属命中；接受可选受控 open/onOpenChange 与 highlightSpaceId（拖拽悬停高亮，Task 12 驱动）。
SpaceMemberList.tsx: 新建空间与管理成员共用的勾选列表；按 orderProjectIdsByRecency 排序，文件夹仓库标「Folder」，行尾标「也在 …」。
SpaceCreateSheet.tsx: 新建空间对话框——名称 + 图标 + 颜色 + 成员一步配完，建完立即 activateSpace；导出 SPACE_ICONS/SPACE_COLORS。
SpaceMemberSheet.tsx: 管理某空间成员的对话框——勾选即调用 setSpaceMembers 写入，无本地草稿。
use-space-dialogs.tsx: 收口 SpaceCreateSheet/SpaceMemberSheet 的开关状态，供 sidebar/index.tsx 挂载。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
