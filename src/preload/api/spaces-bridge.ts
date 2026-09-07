/**
 * [INPUT]: 依赖 electron 的 ipcRenderer，../api-types 的 PreloadApi 类型
 * [OUTPUT]: 对外提供 spacesApi 常量
 * [POS]: preload 侧 Space IPC 桥接实现；按 SpacesApi 签名把每个方法转发到 ipcRenderer.invoke('spaces:*')，onChanged 订阅 'spaces:changed' 广播
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { ipcRenderer } from 'electron'
import type { PreloadApi } from '../api-types'

export const spacesApi = {
  list: () => ipcRenderer.invoke('spaces:list'),
  create: (args) => ipcRenderer.invoke('spaces:create', args),
  update: (args) => ipcRenderer.invoke('spaces:update', args),
  setMembers: (args) => ipcRenderer.invoke('spaces:setMembers', args),
  delete: (args) => ipcRenderer.invoke('spaces:delete', args),
  reorder: (args) => ipcRenderer.invoke('spaces:reorder', args),
  onChanged: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on('spaces:changed', listener)
    return () => ipcRenderer.removeListener('spaces:changed', listener)
  }
} satisfies PreloadApi['spaces']
