/**
 * [INPUT]: 依赖 shared/keybindings 的 keybindingMatchesAction/matchKeybindingDigitIndex，shared/modifier-double-tap-detector 的 ModifierDoubleTapDetector/toModifierDoubleTapEvent，@/store 的 keybindings/spaces/activateSpace/settings.terminalShortcutPolicy，@/lib/shortcut-platform 的 getShortcutPlatform，@/lib/editable-target 的 isEditableTarget
 * [OUTPUT]: 对外提供 useSpaceKeybindings
 * [POS]: Space 的全局键位监听（双击 ⌃ 开选择器、⌘⌥数字直切）；挂在 sidebar/index.tsx
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { getShortcutPlatform } from '@/lib/shortcut-platform'
import { isEditableTarget } from '@/lib/editable-target'
import {
  keybindingMatchesAction,
  matchKeybindingDigitIndex,
  type KeybindingContext,
  type KeybindingMatchOptions
} from '../../../../../shared/keybindings'
import {
  ModifierDoubleTapDetector,
  toModifierDoubleTapEvent
} from '../../../../../shared/modifier-double-tap-detector'

// Why: same xterm-helper-textarea check as app-shell/app-command-handlers.ts and
// terminal-workspace-model.ts — each keybinding listener derives context locally.
function getSpaceKeybindingContext(target: EventTarget | null): KeybindingContext {
  return target instanceof HTMLElement && target.classList.contains('xterm-helper-textarea')
    ? 'terminal'
    : 'app'
}

export function useSpaceKeybindings({ openPicker }: { openPicker: () => void }): void {
  const openPickerRef = useRef(openPicker)
  useEffect(() => {
    openPickerRef.current = openPicker
  }, [openPicker])

  useEffect(() => {
    const doubleTapDetector = new ModifierDoubleTapDetector()

    const onKeyDown = (e: KeyboardEvent): void => {
      const detected = doubleTapDetector.process(
        toModifierDoubleTapEvent({
          type: 'keyDown',
          code: e.code,
          key: e.key,
          shift: e.shiftKey,
          control: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey,
          isAutoRepeat: e.repeat
        }),
        Date.now()
      )
      if (e.repeat || isEditableTarget(e.target)) {
        return
      }

      const platform = getShortcutPlatform()
      const state = useAppStore.getState()
      // Why: no Space chrome is mounted on a client whose spaces API never hydrated (web).
      if (!state.spacesHydrated) {
        return
      }
      const options: KeybindingMatchOptions = {
        context: getSpaceKeybindingContext(e.target),
        terminalShortcutPolicy: state.settings?.terminalShortcutPolicy
      }

      if (
        detected &&
        keybindingMatchesAction(
          'space.picker',
          { doubleTapModifier: detected.modifier },
          platform,
          state.keybindings,
          options
        )
      ) {
        e.preventDefault()
        openPickerRef.current()
        return
      }

      const index = matchKeybindingDigitIndex(
        'space.selectByIndex',
        e,
        platform,
        state.keybindings,
        options
      )
      const space = index === null ? null : state.spaces[index]
      if (space) {
        e.preventDefault()
        state.activateSpace(space.id)
      }
    }

    const onKeyUp = (e: KeyboardEvent): void => {
      doubleTapDetector.process(
        toModifierDoubleTapEvent({
          type: 'keyUp',
          code: e.code,
          key: e.key,
          shift: e.shiftKey,
          control: e.ctrlKey,
          alt: e.altKey,
          meta: e.metaKey
        }),
        Date.now()
      )
    }

    // Why: a window blur mid-gesture must not leave the detector armed.
    const onBlur = (): void => doubleTapDetector.reset()

    // Why: capture phase — a descendant's bubble-phase stopPropagation() must not
    // hide this global gesture from us (mirrors use-global-keybindings.ts).
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
