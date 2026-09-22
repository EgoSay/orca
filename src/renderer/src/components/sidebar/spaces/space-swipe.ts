/**
 * [INPUT]: 无运行时依赖
 * [OUTPUT]: 对外提供 createSwipeTracker、nextSpaceId
 * [POS]: 横滑切空间的纯状态机与环形顺序；被 use-sidebar-space-swipe 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export function createSwipeTracker(options: { threshold: number; lockMs: number }): {
  feed: (deltaX: number, now: number) => -1 | 0 | 1
} {
  let accumulated = 0
  let lockedUntil = 0
  return {
    feed(deltaX, now) {
      if (now < lockedUntil) {
        return 0
      }
      accumulated += deltaX
      if (Math.abs(accumulated) < options.threshold) {
        return 0
      }
      const direction = accumulated > 0 ? 1 : -1
      accumulated = 0
      lockedUntil = now + options.lockMs
      return direction
    }
  }
}

/** Ring order: spaces as given, then null (全部). */
export function nextSpaceId(
  spaces: readonly { id: string }[],
  activeSpaceId: string | null,
  direction: 1 | -1
): string | null {
  const ring: (string | null)[] = [...spaces.map((s) => s.id), null]
  const index = ring.indexOf(activeSpaceId)
  return ring[(index + direction + ring.length) % ring.length]
}
