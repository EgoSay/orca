# components/new-workspace/
> L2 | 父级: /CLAUDE.md

成员清单（本清单先覆盖 Space 层相关成员，其余待补全）
ProjectCombobox.tsx（改动）: 读取 activeSpace/activeSpaceRepoIds 派生 spaceScope（当前空间名 + 成员 projectId 集合），传给 sectionProjectOptions 驱动分组显示。
project-combobox-matching.ts（改动）: sectionProjectOptions 新增可选 spaceScope 参数与 'space' 分区——命中空间的项目单独成组，非命中项目归入「Other projects」，文件夹仍归「Folders」；查询非空时仍走原有单列表逻辑。
project-combobox-matching.test.ts（改动）: 配套 spaceScope 分组用例。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
