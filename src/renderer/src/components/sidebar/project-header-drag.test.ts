// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { isRepoHeaderActionTarget, useRepoHeaderDrag } from './project-header-drag'
import type { Repo } from '../../../../shared/repo-types'

function createHeader(markup: string): HTMLElement {
  const header = document.createElement('div')
  header.setAttribute('data-repo-header-id', 'repo-1')
  header.innerHTML = markup
  document.body.appendChild(header)
  return header
}

function createRepo(id: string): Repo {
  return {
    id,
    path: `/tmp/${id}`,
    displayName: id,
    badgeColor: '#000000',
    addedAt: 0,
    projectGroupId: null,
    projectGroupOrder: 0
  }
}

function spaceTargetEl(id: string, rect: [number, number, number, number]): HTMLElement {
  const node = document.createElement('div')
  node.setAttribute('data-space-drop-target', id)
  node.getBoundingClientRect = () =>
    ({ left: rect[0], top: rect[1], right: rect[2], bottom: rect[3] }) as DOMRect
  document.body.appendChild(node)
  return node
}

function pointerMove(init: PointerEventInit): PointerEvent {
  return new PointerEvent('pointermove', { bubbles: true, pointerId: 1, buttons: 1, ...init })
}

describe('repo header action targets', () => {
  it('ignores explicit project action wrappers', () => {
    const header = createHeader(`
      <span data-repo-header-action="" tabindex="0">
        <span id="icon"></span>
      </span>
    `)

    expect(isRepoHeaderActionTarget(header.querySelector('#icon'), header)).toBe(true)
  })

  it('ignores native nested controls', () => {
    const header = createHeader('<button type="button"><span id="icon"></span></button>')

    expect(isRepoHeaderActionTarget(header.querySelector('#icon'), header)).toBe(true)
  })

  it('does not ignore plain header text or the header itself', () => {
    const header = createHeader('<span id="label">Orca</span>')

    expect(isRepoHeaderActionTarget(header.querySelector('#label'), header)).toBe(false)
    expect(isRepoHeaderActionTarget(header, header)).toBe(false)
  })

  it('ignores the hover collapse affordance', () => {
    const header = createHeader(`
      <div data-repo-header-collapse-affordance="">
        <span id="chevron"></span>
      </div>
    `)

    expect(isRepoHeaderActionTarget(header.querySelector('#chevron'), header)).toBe(true)
  })

  it('ignores the project header actions overlay (including gaps between icons)', () => {
    const header = createHeader(`
      <div data-repo-header-actions="">
        <button type="button" data-repo-header-action=""><span id="icon"></span></button>
      </div>
    `)

    expect(
      isRepoHeaderActionTarget(header.querySelector('[data-repo-header-actions]'), header)
    ).toBe(true)
    expect(isRepoHeaderActionTarget(header.querySelector('#icon'), header)).toBe(true)
  })
})

describe('useRepoHeaderDrag space hover state stability', () => {
  it('keeps the same state object across two pointermoves over the same space target', () => {
    document.body.innerHTML = ''
    spaceTargetEl('s1', [0, 30, 50, 50])
    const scrollContainer = document.createElement('div')
    document.body.append(scrollContainer)
    const handleEl = document.createElement('div')
    handleEl.setAttribute('data-repo-header-drag-handle', '')
    handleEl.setPointerCapture = vi.fn()
    handleEl.releasePointerCapture = vi.fn()
    document.body.append(handleEl)

    const repoById = new Map([['repo-a', createRepo('repo-a')]])
    const sidebarRepoHeaderIdsByBucket = new Map([['ungrouped', ['repo-a', 'repo-b']]])

    const { result } = renderHook(() =>
      useRepoHeaderDrag({
        orderedRepoIds: ['repo-a', 'repo-b'],
        sidebarRepoHeaderIdsByBucket,
        repoById,
        usesProjectGroupOrdering: false,
        onCommitRepoOrder: vi.fn(),
        onCommitProjectGroupOrder: vi.fn(),
        getScrollContainer: () => scrollContainer
      })
    )

    act(() => {
      result.current.onHandlePointerDown(
        {
          button: 0,
          pointerId: 1,
          clientX: 0,
          clientY: 0,
          target: handleEl,
          currentTarget: handleEl
        } as unknown as React.PointerEvent<HTMLElement>,
        'repo-a'
      )
    })
    act(() => {
      window.dispatchEvent(pointerMove({ clientX: 5, clientY: 40 }))
    })

    const stateAfterFirstHover = result.current.state
    expect(stateAfterFirstHover.hoverSpaceTargetId).toBe('s1')

    act(() => {
      window.dispatchEvent(pointerMove({ clientX: 6, clientY: 41 }))
    })

    // Why: a stationary hover must not force consumers of `state` to re-render every pointermove.
    expect(result.current.state).toBe(stateAfterFirstHover)
  })
})
