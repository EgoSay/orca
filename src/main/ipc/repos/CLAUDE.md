# main/ipc/repos/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
space-handlers.ts: registerSpaceHandlers/notifySpacesChanged——Space 的 IPC 入口（spaces:list/create/update/setMembers/delete/reorder + spaces:changed 推送），形状照抄 project-group-handlers.ts，仅 local，不走 runtime RPC。
space-handlers.test.ts: registerSpaceHandlers 各 IPC channel 的用例。
repo-ipc-arg-schemas.ts（改动）: 新增 SpaceCreateArgs/SpaceUpdateArgs/SpaceSetMembersArgs/SpaceSelectorArgs/SpaceReorderArgs 的 zod 校验 schema，供 space-handlers 用 parseProjectGroupIpcArgs 解析。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
