import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { RoundRobinProcess } from '../main/types-round-robin'

type RoundRobinStatus = 'idle' | 'running' | 'paused' | 'finished'

type RoundRobinUpdate = {
  processes: RoundRobinProcess[]
  status: RoundRobinStatus
}

// Custom APIs for renderer
const api = {
  roundRobin: {
    start: (payload: { processes: unknown[]; quantum: number; delay: number }) =>
      ipcRenderer.invoke('round-robin:start', payload),
    pause: () => ipcRenderer.invoke('round-robin:pause'),
    resume: () => ipcRenderer.invoke('round-robin:resume'),
    reset: () => ipcRenderer.invoke('round-robin:reset'),
    onUpdate: (cb: (data: RoundRobinUpdate) => void) => {
      const listener = (_: unknown, data: RoundRobinUpdate) => cb(data)
      ipcRenderer.on('round-robin:update', listener)
      return () => ipcRenderer.removeListener('round-robin:update', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI

  // @ts-ignore (define in dts)
  window.api = api
}
