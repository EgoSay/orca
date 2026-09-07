// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { findSpaceDropTarget } from './space-drop-target'

function el(id: string, rect: [number, number, number, number]): HTMLElement {
  const node = document.createElement('div')
  node.setAttribute('data-space-drop-target', id)
  node.getBoundingClientRect = () =>
    ({ left: rect[0], top: rect[1], right: rect[2], bottom: rect[3] }) as DOMRect
  document.body.appendChild(node)
  return node
}

describe('findSpaceDropTarget', () => {
  it('returns the id under the pointer, "" for the trigger, null elsewhere', () => {
    document.body.innerHTML = ''
    el('', [0, 0, 50, 20])
    el('s1', [0, 30, 50, 50])
    expect(findSpaceDropTarget(document.body, 10, 10)).toBe('')
    expect(findSpaceDropTarget(document.body, 10, 40)).toBe('s1')
    expect(findSpaceDropTarget(document.body, 100, 100)).toBeNull()
  })
})
