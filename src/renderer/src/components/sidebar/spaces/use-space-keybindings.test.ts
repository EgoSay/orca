// @vitest-environment happy-dom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'
import { useSpaceKeybindings } from './use-space-keybindings'

const initialState = useAppStore.getInitialState()

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useAppStore.setState(initialState, true)
})

// Why: a real double-tap is keydown -> keyup (arms it) -> keydown (fires).
function dispatchControlTap(target: EventTarget): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Control', code: 'ControlLeft', bubbles: true })
  )
  target.dispatchEvent(
    new KeyboardEvent('keyup', { key: 'Control', code: 'ControlLeft', bubbles: true })
  )
}

it('opens the picker on a Control double-tap, even through a descendant bubble-phase stopPropagation()', () => {
  useAppStore.setState({ spacesHydrated: true })
  const openPicker = vi.fn()
  const button = document.createElement('button')
  // Why: mirrors HostSectionHeaderMenu.tsx's onKeyDown={(e) => e.stopPropagation()} —
  // a bubble-phase window listener would never see this; a capture-phase one must.
  button.addEventListener('keydown', (e) => e.stopPropagation())
  document.body.appendChild(button)

  renderHook(() => useSpaceKeybindings({ openPicker }))

  act(() => {
    dispatchControlTap(button)
    dispatchControlTap(button)
  })

  expect(openPicker).toHaveBeenCalledTimes(1)
  button.remove()
})

it('ignores a Control double-tap dispatched on an editable target', () => {
  const openPicker = vi.fn()
  const input = document.createElement('input')
  document.body.appendChild(input)

  renderHook(() => useSpaceKeybindings({ openPicker }))

  act(() => {
    dispatchControlTap(input)
    dispatchControlTap(input)
  })

  expect(openPicker).not.toHaveBeenCalled()
  input.remove()
})

it('does not switch spaces from a terminal target under the terminal-first policy', () => {
  // Why: mirrors the terminal-first fixtures in TabBarQuickCommandsMenu.keyboard.test.ts —
  // a terminal target + terminal-first policy must gate an action with no allowInTerminal.
  vi.stubGlobal('navigator', { userAgent: 'Mac' })
  const activateSpace = vi.fn()
  useAppStore.setState({
    settings: { terminalShortcutPolicy: 'terminal-first' } as never,
    spaces: [{ id: 'space-1' }] as never,
    spacesHydrated: true,
    activateSpace
  })
  const openPicker = vi.fn()
  const terminalTarget = document.createElement('textarea')
  terminalTarget.className = 'xterm-helper-textarea'
  document.body.appendChild(terminalTarget)

  renderHook(() => useSpaceKeybindings({ openPicker }))

  act(() => {
    terminalTarget.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: '1',
        code: 'Digit1',
        metaKey: true,
        altKey: true,
        bubbles: true
      })
    )
  })

  expect(activateSpace).not.toHaveBeenCalled()
  terminalTarget.remove()
})

it('removes its listeners on unmount', () => {
  const openPicker = vi.fn()
  const { unmount } = renderHook(() => useSpaceKeybindings({ openPicker }))
  unmount()

  act(() => {
    dispatchControlTap(window)
    dispatchControlTap(window)
  })

  expect(openPicker).not.toHaveBeenCalled()
})

it('stays silent on a client whose spaces API never hydrated (web fallback)', () => {
  const openPicker = vi.fn()
  renderHook(() => useSpaceKeybindings({ openPicker }))

  act(() => {
    dispatchControlTap(window)
    dispatchControlTap(window)
  })

  expect(openPicker).not.toHaveBeenCalled()
})
