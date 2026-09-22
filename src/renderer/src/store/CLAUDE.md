# store/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
spaces/: 见 spaces/CLAUDE.md
slices/spaces.test.ts: spaces 切片用例——web fallback API（各方法 resolve undefined）下 spacesHydrated 不翻转、状态不被污染；activateSpace 的持久化与主机限定跳过。
index.ts（改动）: 装配 createSpacesSlice(...a) 进 useAppStore。
types.ts（改动）: AppState 交叉 SpacesSlice。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
