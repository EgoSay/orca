/**
 * [INPUT]: 依赖 react
 * [OUTPUT]: 对外提供 SpaceDot 组件
 * [POS]: Space 的彩色身份圆点；SpaceSwitcher 与 app-shell/TitlebarPathBar 共用，独立成文件以免路径栏为一个圆点反向依赖整个切换器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from 'react'

export function SpaceDot({ color }: { color: string | null }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
      style={{ background: color ?? 'var(--muted-foreground)' }}
    />
  )
}
