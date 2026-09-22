# main/persistence/tracking-repos/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
space-operations.ts: SpacePersistenceOperations 类——Space 的持久化写路径（getSpaces/createSpace/updateSpace/setSpaceMembers/deleteSpace/reorderSpaces），形状照抄 project-group-operations.ts，由 project-collection-operations 懒装配。
space-operations.test.ts: SpacePersistenceOperations 各写方法的用例。
space-member-removal.ts: removeRepoFromSpaces——repo 离开 state.repos 时剥离其成员 id；只处理离场那一个 id，绝不按本地 repo 集合全量裁剪（runtime host 的项目不落本地盘）。
space-member-removal.test.ts: 离场剥离、同项目跨主机存活保留、legacy repo: 形态、无变更四类用例。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
