/**
 * [INPUT]: 依赖 shared/keybindings 的 KeybindingContext 类型
 * [OUTPUT]: 对外提供 getKeybindingContext
 * [POS]: 全局键位监听共用的作用域判定（终端 vs 应用）；app-shell/tab-bar/sidebar 三处监听器都从这里读，杜绝各自复刻
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { KeybindingContext } from '../../../shared/keybindings'

/**
 * Which keybinding scope an event belongs to.
 *
 * Duck-typed rather than `instanceof HTMLElement`: xterm's helper textarea can
 * arrive from another document (popout window), where the constructor differs.
 */
export function getKeybindingContext(target: EventTarget | null): KeybindingContext {
  const classList = (target as { classList?: { contains?: (value: string) => boolean } } | null)
    ?.classList
  return typeof classList?.contains === 'function' && classList.contains('xterm-helper-textarea')
    ? 'terminal'
    : 'app'
}
