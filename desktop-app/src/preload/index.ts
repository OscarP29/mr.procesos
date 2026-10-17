import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  roundRobin: {
    start: (processes: unknown[]) => ipcRenderer.invoke('round-robin:start', processes),

    onUpdate: (callback: (processes: unknown[]) => void) => {
      const listener = (_: Electron.IpcRendererEvent, processes: unknown[]) => {
        callback(processes)
      }

      ipcRenderer.on('round-robin:update', listener)

      return () => {
        ipcRenderer.removeListener('round-robin:update', listener)
      }
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
