/**
 * [INPUT]: 依赖 electron ipcMain，persistence Store 的 space 方法，./repo-ipc-arg-schemas 的 Space* schema
 * [OUTPUT]: 对外提供 registerSpaceHandlers、notifySpacesChanged
 * [POS]: Space 的 IPC 入口；形状照抄 project-group-handlers.ts，仅 local，不走 runtime RPC
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import type { Store } from '../../persistence'
import type { Space } from '../../../shared/space-types'
import {
  SpaceCreateArgs,
  SpaceReorderArgs,
  SpaceSelectorArgs,
  SpaceSetMembersArgs,
  SpaceUpdateArgs,
  parseProjectGroupIpcArgs
} from './repo-ipc-arg-schemas'

export const SPACE_IPC_CHANNELS = [
  'spaces:list',
  'spaces:create',
  'spaces:update',
  'spaces:setMembers',
  'spaces:delete',
  'spaces:reorder'
] as const

export function notifySpacesChanged(mainWindow: BrowserWindow): void {
  if (!mainWindow.isDestroyed()) {
    mainWindow.webContents.send('spaces:changed')
  }
}

export function registerSpaceHandlers(mainWindow: BrowserWindow, store: Store): void {
  ipcMain.handle('spaces:list', () => store.getSpaces())

  ipcMain.handle('spaces:create', (_event, rawArgs: unknown): Space => {
    const args = parseProjectGroupIpcArgs(SpaceCreateArgs, rawArgs, 'invalid_space_create_args')
    const space = store.createSpace({
      name: args.name,
      icon: args.icon ?? null,
      color: args.color ?? null,
      memberIds: args.memberIds as Space['memberIds']
    })
    notifySpacesChanged(mainWindow)
    return space
  })

  ipcMain.handle('spaces:update', (_event, rawArgs: unknown): Space | null => {
    const args = parseProjectGroupIpcArgs(SpaceUpdateArgs, rawArgs, 'invalid_space_update_args')
    const updated = store.updateSpace(args.spaceId, args.updates)
    if (updated) {
      notifySpacesChanged(mainWindow)
    }
    return updated
  })

  ipcMain.handle('spaces:setMembers', (_event, rawArgs: unknown): Space | null => {
    const args = parseProjectGroupIpcArgs(
      SpaceSetMembersArgs,
      rawArgs,
      'invalid_space_set_members_args'
    )
    const updated = store.setSpaceMembers(args.spaceId, args.memberIds)
    if (updated) {
      notifySpacesChanged(mainWindow)
    }
    return updated
  })

  ipcMain.handle('spaces:delete', (_event, rawArgs: unknown): boolean => {
    const args = parseProjectGroupIpcArgs(SpaceSelectorArgs, rawArgs, 'invalid_space_delete_args')
    const deleted = store.deleteSpace(args.spaceId)
    if (deleted) {
      notifySpacesChanged(mainWindow)
    }
    return deleted
  })

  ipcMain.handle('spaces:reorder', (_event, rawArgs: unknown): Space[] => {
    const args = parseProjectGroupIpcArgs(SpaceReorderArgs, rawArgs, 'invalid_space_reorder_args')
    const spaces = store.reorderSpaces(args.orderedIds)
    notifySpacesChanged(mainWindow)
    return spaces
  })
}
