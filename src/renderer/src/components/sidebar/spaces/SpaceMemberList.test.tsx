// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '@/store'
import { SpaceMemberList } from './SpaceMemberList'

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
})
