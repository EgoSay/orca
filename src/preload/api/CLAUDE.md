# preload/api/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
spaces-api.ts: SpacesApi 类型——list/create/update/setMembers/delete/reorder/onChanged 的渲染进程可见签名。
spaces-bridge.ts: spacesApi 实现——按 SpacesApi 签名把每个方法转发到对应 ipcRenderer.invoke('spaces:*')，onChanged 订阅 'spaces:changed' 广播。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
