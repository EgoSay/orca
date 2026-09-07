// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import { resolveEndDragOutcome } from './project-header-drag-contract'
import { SPACE_SWITCHER_DROP_TARGET } from './spaces/space-drop-target'
import type { ProjectHeaderDragSession } from './project-header-drag-contract'

function makeSession(overrides: Partial<ProjectHeaderDragSession> = {}): ProjectHeaderDragSession {
  return {
    repoId: 'repo-a',
    bucketKey: 'ungrouped',
    sidebarRepoHeaderIds: ['repo-a', 'repo-b'],
    pointerId: 1,
    headerRects: [],
    handleEl: document.createElement('div'),
    startX: 0,
    startY: 0,
    latestPointerY: 0,
    latestPointerX: 0,
    promoted: true,
    externalTargetId: null,
    ...overrides
  }
}

describe('resolveEndDragOutcome', () => {
  it('lands on a space when released over a menu item', () => {
    const session = makeSession({ externalTargetId: 's1' })
    expect(resolveEndDragOutcome(session, true, 3)).toEqual({ kind: 'space', spaceId: 's1' })
  })

  it('is a no-op when released over the trigger, even with a stale drop index', () => {
    const session = makeSession({ externalTargetId: SPACE_SWITCHER_DROP_TARGET })
    expect(resolveEndDragOutcome(session, true, 3)).toEqual({ kind: 'none' })
  })

  it('reorders when released over the list with no external target', () => {
    const session = makeSession({ externalTargetId: null })
    expect(resolveEndDragOutcome(session, true, 3)).toEqual({
      kind: 'reorder',
      sidebarDropIndex: 3
    })
  })

  it('is a no-op when not committing or not promoted', () => {
    const session = makeSession({ externalTargetId: 's1', promoted: false })
    expect(resolveEndDragOutcome(session, true, 3)).toEqual({ kind: 'none' })
    expect(resolveEndDragOutcome(makeSession(), false, 3)).toEqual({ kind: 'none' })
  })
})
