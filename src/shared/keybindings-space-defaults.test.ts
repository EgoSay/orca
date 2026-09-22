// Default keybindings for the Space picker and digit-index switch.
import { describe, expect, it } from 'vitest'
import { KEYBINDING_DEFINITIONS } from './keybindings/definitions'
import { findKeybindingConflicts, keybindingMatchesAction } from './keybindings'

describe('space keybinding defaults', () => {
  it('introduces no default conflict on linux, where Ctrl is the primary modifier', () => {
    expect(findKeybindingConflicts('linux', {})).toEqual([])
  })

  it('binds the picker to DoubleTap+Ctrl on every platform', () => {
    const picker = KEYBINDING_DEFINITIONS.find((d) => d.id === 'space.picker')!
    expect(picker.defaultBindings).toEqual({
      darwin: ['DoubleTap+Ctrl'],
      linux: ['DoubleTap+Ctrl'],
      win32: ['DoubleTap+Ctrl']
    })
    expect(
      keybindingMatchesAction('space.picker', { doubleTapModifier: 'Ctrl' }, 'darwin', {})
    ).toBe(true)
  })

  it('binds select-by-index only on macOS', () => {
    const byIndex = KEYBINDING_DEFINITIONS.find((d) => d.id === 'space.selectByIndex')!
    expect(byIndex.defaultBindings.darwin).toEqual(['Mod+Alt+1'])
    expect(byIndex.defaultBindings.linux).toEqual([])
    expect(byIndex.defaultBindings.win32).toEqual([])
  })
})
