// @vitest-environment happy-dom

/**
 * Why the dropdown-menu mock: Radix's real open/close mechanics need pointer
 * capture APIs happy-dom doesn't model (see SidebarSettingsHelpMenu.test.tsx
 * and WorktreeDeveloperMenuReveal.test.tsx for the same convention). A
 * passthrough keeps these tests on SpaceSwitcher's own wiring — the store
 * reads, activateSpace calls, drop-target attributes — rather than menu
 * mechanics owned by the primitive itself.
 */
import '@testing-library/jest-dom/vitest'

import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '@/store'
import { SpaceSwitcher } from './SpaceSwitcher'

const initialState = useAppStore.getInitialState()

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, values?: Record<string, string>) =>
    fallback.replace(/\{\{value0\}\}/g, values?.value0 ?? '')
}))

vi.mock('@/components/ui/dropdown-menu', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>
  return {
    DropdownMenu: passthrough,
    DropdownMenuTrigger: passthrough,
    DropdownMenuContent: passthrough,
    DropdownMenuLabel: passthrough,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuItem: ({
      children,
      onSelect,
      disabled,
      className,
      ...rest
    }: {
      children?: ReactNode
      onSelect?: () => void
      disabled?: boolean
      className?: string
    } & Record<string, unknown>) => (
      <div
        role="menuitem"
        aria-disabled={disabled}
        className={className}
        onClick={() => {
          if (!disabled) {
            onSelect?.()
          }
        }}
        {...rest}
      >
        {children}
      </div>
    )
  }
})

const SPACES = [
  {
    id: 'a',
    name: '写作',
    icon: '✍️',
    color: '#8b5cf6',
    memberIds: [],
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0
  },
  {
    id: 'b',
    name: '开发',
    icon: '⚙️',
    color: '#1447e6',
    memberIds: [],
    sortOrder: 1,
    createdAt: 0,
    updatedAt: 0
  }
]

afterEach(() => {
  cleanup()
  useAppStore.setState(initialState, true)
})

describe('SpaceSwitcher', () => {
  it('shows the active space name and activates another on select', () => {
    const activateSpace = vi.fn()
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: 'b',
      activateSpace
    } as never)
    render(<SpaceSwitcher onManageMembers={() => {}} onCreateSpace={() => {}} />)

    expect(screen.getByRole('button', { name: /开发/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /开发/ }))
    fireEvent.click(screen.getByText('写作'))
    expect(activateSpace).toHaveBeenCalledWith('a')
  })

  it('shows "All" and activates null when no space is active', () => {
    const activateSpace = vi.fn()
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: null,
      activateSpace
    } as never)
    render(<SpaceSwitcher onManageMembers={() => {}} onCreateSpace={() => {}} />)

    expect(screen.getByRole('button', { name: /All/ })).toBeTruthy()
    const allMenuItem = screen
      .getAllByText('All')
      .map((el) => el.closest('[role="menuitem"]'))
      .find((el): el is HTMLElement => el !== null)
    fireEvent.click(allMenuItem as HTMLElement)
    expect(activateSpace).toHaveBeenCalledWith(null)
  })

  it('disables manage-members under All and enables it for the active space', () => {
    const onManageMembers = vi.fn()
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: null,
      activateSpace: vi.fn()
    } as never)
    const { rerender } = render(
      <SpaceSwitcher onManageMembers={onManageMembers} onCreateSpace={() => {}} />
    )
    expect(
      screen.getByText('All has no members to manage').closest('[role="menuitem"]')
    ).toHaveAttribute('aria-disabled', 'true')

    useAppStore.setState({ activeSpaceId: 'b' } as never)
    rerender(<SpaceSwitcher onManageMembers={onManageMembers} onCreateSpace={() => {}} />)
    fireEvent.click(screen.getByText('Manage projects in 开发…'))
    expect(onManageMembers).toHaveBeenCalledWith('b')
  })

  it('calls onCreateSpace when "New space…" is selected', () => {
    const onCreateSpace = vi.fn()
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: 'b',
      activateSpace: vi.fn()
    } as never)
    render(<SpaceSwitcher onManageMembers={() => {}} onCreateSpace={onCreateSpace} />)

    fireEvent.click(screen.getByText('New space…'))
    expect(onCreateSpace).toHaveBeenCalled()
  })

  it('marks the trigger and each space item as drop targets, with a shortcut hint on the first nine', () => {
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: 'b',
      activateSpace: vi.fn()
    } as never)
    render(<SpaceSwitcher onManageMembers={() => {}} onCreateSpace={() => {}} />)

    expect(screen.getByRole('button', { name: /开发/ })).toHaveAttribute(
      'data-space-drop-target',
      ''
    )
    expect(screen.getByText('写作').closest('[role="menuitem"]')).toHaveAttribute(
      'data-space-drop-target',
      'a'
    )
    expect(screen.getByText('写作').closest('[role="menuitem"]')?.textContent).toContain('⌘⌥1')
  })

  it('rings the item matching highlightSpaceId', () => {
    useAppStore.setState({
      spaces: SPACES,
      activeSpaceId: 'b',
      activateSpace: vi.fn()
    } as never)
    render(
      <SpaceSwitcher onManageMembers={() => {}} onCreateSpace={() => {}} highlightSpaceId="a" />
    )

    expect(screen.getByText('写作').closest('[role="menuitem"]')?.className).toContain('ring-ring')
  })
})
