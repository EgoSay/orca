// @vitest-environment happy-dom

/**
 * Why the dropdown-menu/tooltip mocks: Radix's real open/close mechanics need
 * pointer capture APIs happy-dom doesn't model (see SpaceSwitcher.test.tsx for
 * the same convention). A passthrough keeps these tests on the menu's own
 * wiring — which items render, which handler fires — rather than primitive
 * mechanics.
 */
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '@/store'
import { RepoHeaderProjectActionsMenu } from './repo-header-project-actions'

const initialState = useAppStore.getInitialState()

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, values?: Record<string, string>) =>
    fallback.replace(/\{\{value0\}\}/g, values?.value0 ?? '')
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>
}))

vi.mock('@/components/ui/dropdown-menu', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>
  return {
    DropdownMenu: passthrough,
    DropdownMenuTrigger: passthrough,
    DropdownMenuContent: passthrough,
    DropdownMenuSub: passthrough,
    DropdownMenuSubContent: passthrough,
    DropdownMenuSubTrigger: passthrough,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuItem: ({
      children,
      onSelect,
      disabled,
      ...rest
    }: {
      children?: ReactNode
      onSelect?: () => void
      disabled?: boolean
    } & Record<string, unknown>) => (
      <div
        role="menuitem"
        aria-disabled={disabled}
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

const repo = {
  id: 'r1',
  path: '/r1',
  displayName: 'orca',
  badgeColor: '#000',
  addedAt: 0,
  projectGroupId: null
} as never

function buildActions(onRemoveProjectFromSpace = vi.fn()) {
  return {
    getWorktreeVisibilityDefaults: () => undefined,
    onOpenRepoSettings: vi.fn(),
    onOpenWorktreeVisibility: vi.fn(),
    onCreateGroupFromRepo: vi.fn(),
    onMoveProjectToGroup: vi.fn(),
    onRemoveProjectFromGroup: vi.fn(),
    onRemoveProject: vi.fn(),
    onCreateForRepo: vi.fn(),
    onRemoveProjectFromSpace
  }
}

afterEach(() => {
  cleanup()
  useAppStore.setState(initialState, true)
})

describe('RepoHeaderProjectActionsMenu space item', () => {
  it('offers "Remove from space" only when the repo is a member of the active space', () => {
    const onRemoveProjectFromSpace = vi.fn()
    useAppStore.setState({
      spaces: [
        {
          id: 's',
          name: '开发',
          icon: null,
          color: null,
          memberIds: ['repo:r1'],
          sortOrder: 0,
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeSpaceId: 's'
    } as never)

    render(
      <RepoHeaderProjectActionsMenu
        repo={repo}
        label="orca"
        projectGroups={[]}
        actions={buildActions(onRemoveProjectFromSpace)}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Project actions/ }))
    fireEvent.click(screen.getByText(/Remove from 开发/))
    expect(onRemoveProjectFromSpace).toHaveBeenCalledWith(repo)
  })

  it('hides the item when the repo is not a member of the active space', () => {
    useAppStore.setState({
      spaces: [
        {
          id: 's',
          name: '开发',
          icon: null,
          color: null,
          memberIds: [],
          sortOrder: 0,
          createdAt: 0,
          updatedAt: 0
        }
      ],
      activeSpaceId: 's'
    } as never)

    render(
      <RepoHeaderProjectActionsMenu
        repo={repo}
        label="orca"
        projectGroups={[]}
        actions={buildActions()}
      />
    )
    expect(screen.queryByText(/Remove from 开发/)).toBeNull()
  })

  it('hides the item under 全部 (no active space)', () => {
    useAppStore.setState({ spaces: [], activeSpaceId: null } as never)

    render(
      <RepoHeaderProjectActionsMenu
        repo={repo}
        label="orca"
        projectGroups={[]}
        actions={buildActions()}
      />
    )
    expect(screen.queryByText(/Remove from/)).toBeNull()
  })
})
