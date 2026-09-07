# shared/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
space-types.ts: 无运行时依赖——SpaceMemberId/Space/SpaceUpdate 类型，shared 的 Space 领域类型定义，被 persisted-state-types / space-membership / spaces 消费。
space-membership.ts: toSpaceMemberId/buildSetupByRepoId/resolveSpaceRepoIds——Space 成员身份的唯一降级点，project:/repo: 分支只存在于 toSpaceMemberId。
space-membership.test.ts: space-membership 用例。
spaces.ts: createSpace/normalizeSpaceName/normalizeSpaces/pruneMissingSpaceMembers/normalizeActiveSpaceId/isSpaceMemberId——Space 记录的生命周期纯函数，main 持久化与 renderer 共用，形状照抄 project-groups.ts。
spaces.test.ts: spaces.ts 各生命周期函数的用例。
keybindings-space-defaults.test.ts: Space 选择器与数字直切的默认键位用例（DoubleTap+Ctrl、⌘⌥数字）。
constants.ts（改动）: getDefaultPersistedState 新增 spaces: [] 初始值。
persisted-state-types.ts（改动）: PersistedState 新增 spaces: Space[]（纯客户端，不上 remote wire）。
persisted-ui-state-types.ts（改动）: PersistedUIState 新增 activeSpaceId?: string | null（null = 「全部」伪空间，永远存在、不可删、不可编辑成员）。
keybindings-double-tap.test.ts（改动）: darwin-only 用例调整——DoubleTap+Ctrl 在 linux/win32 上已是 space.picker 的真实默认键位，不再是安全的自别名对。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
