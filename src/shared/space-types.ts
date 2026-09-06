/**
 * [INPUT]: 无运行时依赖
 * [OUTPUT]: 对外提供 SpaceMemberId、Space、SpaceUpdate 类型
 * [POS]: shared 的 Space 领域类型，被 persisted-state-types / space-membership / spaces 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 空间成员的归一化身份。project: 优先；repo: 是遗留仓库的降级形态。 */
export type SpaceMemberId = `project:${string}` | `repo:${string}`

export type Space = {
  id: string
  name: string
  /** 单个 emoji 字符；null = 无图标。 */
  icon: string | null
  /** 只用于切换器 / 路径栏圆点与 ⌘J chip；不染 chrome。 */
  color: string | null
  /** 多归属：成员挂在 Space 上，repo / project 一个字节不动。 */
  memberIds: SpaceMemberId[]
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export type SpaceUpdate = Partial<Pick<Space, 'name' | 'icon' | 'color' | 'sortOrder'>>
