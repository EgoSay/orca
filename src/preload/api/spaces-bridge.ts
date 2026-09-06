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
