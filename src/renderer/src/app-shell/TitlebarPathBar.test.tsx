// @vitest-environment happy-dom

import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '@/store'
import { TitlebarPathBar } from './TitlebarPathBar'

const mocks = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  setActiveWorktree: vi.fn(),
  activateSpace: vi.fn()
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Partial<AppState>) => unknown) => selector(mocks.state)
}))

// Why: radix renders its content in a portal behind a trigger click; render the
// items inline so a test can select a crumb sibling without driving the menu.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuItem: ({ children, onSelect }: { children: ReactNode; onSelect: () => void }) => (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  )
}))

vi.mock('../components/sidebar/spaces/SpaceDot', () => ({
  SpaceDot: () => <span data-space-dot="" />
}))

const roots: Root[] = []

function worktree(id: string, hostId?: string) {
  return {
    id,
    repoId: 'repo-1',
    path: `/repo/${id}`,
    head: 'abc',
    branch: `refs/heads/${id}`,
    isBare: false,
    isMainWorktree: id === 'wt-1',
    displayName: id,
    comment: '',
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    isUnread: false,
    isPinned: false,
    sortOrder: 0,
    lastActivityAt: 0,
    ...(hostId ? { hostId } : {})
  }
}

function seedState(overrides: Record<string, unknown> = {}): void {
  mocks.state = {
    spaces: [
      {
        id: 'space-1',
        name: 'Work',
        icon: null,
        color: '#123456',
        memberIds: ['repo:repo-1'],
        sortOrder: 0,
        createdAt: 1,
        updatedAt: 1
      }
    ],
    activeSpaceId: 'space-1',
    spacesHydrated: true,
    repos: [{ id: 'repo-1', path: '/repo', displayName: 'Repo', badgeColor: '#000', addedAt: 0 }],
    projectHostSetups: [],
    activeWorktreeId: 'wt-1',
    worktreesByRepo: { 'repo-1': [worktree('wt-1'), worktree('wt-2', 'ssh:box')] },
    lastVisitedAtByWorktreeId: {},
    activateSpace: mocks.activateSpace,
    setActiveWorktree: mocks.setActiveWorktree,
    ...overrides
  }
}

async function render(): Promise<HTMLDivElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => {
    root.render(<TitlebarPathBar />)
  })
  return container
}

describe('TitlebarPathBar', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    mocks.setActiveWorktree.mockClear()
    mocks.activateSpace.mockClear()
    seedState()
  })

  afterEach(() => {
    for (const root of roots.splice(0)) {
      act(() => root.unmount())
    }
    document.body.innerHTML = ''
  })

  it('renders the space crumb once the spaces API has hydrated', async () => {
    const container = await render()

    expect(container.textContent).toContain('Work')
  })

  // Why: on the web client every spaces method resolves undefined, so the crumb
  // would offer a space list that can never be honoured.
  it('drops the space crumb while spaces never hydrated', async () => {
    seedState({ spacesHydrated: false })
    const container = await render()

    expect(container.textContent).not.toContain('Work')
    expect(container.textContent).toContain('Repo')
  })

  // Why STA-4343: `repoId::path` ids repeat across execution hosts, so a bare id
  // can resolve to the wrong host's workspace.
  it('host-qualifies the worktree crumb selection', async () => {
    const container = await render()
    const target = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('wt-2')
    )
    expect(target).toBeDefined()

    await act(async () => {
      target?.click()
    })

    expect(mocks.setActiveWorktree).toHaveBeenCalledWith('wt-2', 'ssh:box')
  })
})
