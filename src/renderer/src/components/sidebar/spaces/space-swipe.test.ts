import { describe, expect, it } from 'vitest'
import { createSwipeTracker, nextSpaceId } from './space-swipe'

describe('createSwipeTracker', () => {
  it('fires once past the threshold and locks for lockMs', () => {
    const t = createSwipeTracker({ threshold: 90, lockMs: 550 })
    expect(t.feed(40, 0)).toBe(0)
    expect(t.feed(60, 10)).toBe(1)
    expect(t.feed(200, 20)).toBe(0)
    expect(t.feed(-100, 600)).toBe(-1)
  })
})

describe('nextSpaceId', () => {
  const spaces = [{ id: 'a' }, { id: 'b' }] as never
  it('cycles a → b → 全部(null) → a', () => {
    expect(nextSpaceId(spaces, 'a', 1)).toBe('b')
    expect(nextSpaceId(spaces, 'b', 1)).toBeNull()
    expect(nextSpaceId(spaces, null, 1)).toBe('a')
    expect(nextSpaceId(spaces, 'a', -1)).toBeNull()
  })
})
