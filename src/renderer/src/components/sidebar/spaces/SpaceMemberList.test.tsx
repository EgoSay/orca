// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '@/store'
import { SpaceMemberList } from './SpaceMemberList'

afterEach(() => {
  cleanup()
})

describe('SpaceMemberList', () => {
  it('lists projects with their normalized member id and marks other memberships', () => {
    useAppStore.setState({
      repos: [{ id: 'r1', path: '/r1', displayName: 'orca', badgeColor: '#000', addedAt: 0 }],
      projectHostSetups: [],
      worktreesByRepo: {},
      spaces: [
        {
          id: 'other',
          name: '写作',
          icon: null,
          color: null,
          memberIds: ['repo:r1'],
          sortOrder: 0,
          createdAt: 0,
          updatedAt: 0
        }
      ]
    } as never)
    const onToggle = vi.fn()
    render(<SpaceMemberList selected={new Set()} onToggle={onToggle} excludeSpaceId="x" />)
    expect(screen.getByText(/写作/)).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: /orca/ }))
    expect(onToggle).toHaveBeenCalledWith('repo:r1', true)
  })

  it('tags folder repos as Folder and leaves git repos untagged', () => {
    useAppStore.setState({
      repos: [
        { id: 'r1', path: '/r1', displayName: 'orca', badgeColor: '#000', addedAt: 0 },
        {
          id: 'r2',
          path: '/r2',
          displayName: 'notes',
          badgeColor: '#000',
          addedAt: 0,
          kind: 'folder'
        }
      ],
      projectHostSetups: [],
      worktreesByRepo: {},
      spaces: []
    } as never)
    render(<SpaceMemberList selected={new Set()} onToggle={vi.fn()} />)

    const gitRow = screen.getByText('orca').closest('label')
    const folderRow = screen.getByText('notes').closest('label')
    expect(gitRow?.textContent).not.toContain('Folder')
    expect(folderRow?.textContent).toContain('Folder')
  })
})
