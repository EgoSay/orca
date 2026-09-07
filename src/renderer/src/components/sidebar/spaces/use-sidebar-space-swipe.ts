/**
 * [INPUT]: 依赖 ./space-swipe，@/store 的 spaces/activeSpaceId/activateSpace，@/hooks/usePrefersReducedMotion
 * [OUTPUT]: 对外提供 useSidebarSpaceSwipe
 * [POS]: 在侧边栏根容器上监听横向 wheel，两指横滑切空间；≥2 个空间才启用；reduced-motion 下不做位移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect } from 'react'
import type React from 'react'
import { useAppStore } from '@/store'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { createSwipeTracker, nextSpaceId } from './space-swipe'

// Why: 侧边栏内嵌了看板泳道等横向滚动区域，滑到那里的手势要留给原生滚动，不能被当成切空间。
function hasHorizontalScrollAncestor(target: EventTarget | null, root: HTMLElement): boolean {
  let node = target instanceof Node ? target : null
  while (node && node !== root) {
    if (node instanceof HTMLElement) {
      const overflowX = window.getComputedStyle(node).overflowX
      if (node.scrollWidth > node.clientWidth && (overflowX === 'auto' || overflowX === 'scroll')) {
        return true
      }
    }
    node = node.parentNode
  }
  return false
}

export function useSidebarSpaceSwipe(containerRef: React.RefObject<HTMLElement | null>): void {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }
    const tracker = createSwipeTracker({ threshold: 90, lockMs: 550 })
    const onWheel = (e: WheelEvent): void => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
        return
      }
      const state = useAppStore.getState()
      if (state.spaces.length < 2) {
        return
      }
      if (hasHorizontalScrollAncestor(e.target, node)) {
        return
      }
      e.preventDefault()
      const direction = tracker.feed(e.deltaX, Date.now())
      if (direction === 0) {
        return
      }
      if (!reduced) {
        node.style.transition = 'transform 220ms ease, opacity 220ms ease'
        node.style.transform = `translateX(${direction > 0 ? -28 : 28}px)`
        node.style.opacity = '0'
        window.setTimeout(() => {
          node.style.transform = ''
          node.style.opacity = ''
        }, 230)
      }
      state.activateSpace(nextSpaceId(state.spaces, state.activeSpaceId, direction))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [containerRef, reduced])
}
