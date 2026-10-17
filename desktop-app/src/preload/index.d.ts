import { ElectronAPI } from '@electron-toolkit/preload'

interface RoundRobinProcess {
  pid: number
  nombre: string
  descripcion: string
  usuario: string
  prioridad: 0 | 1

  status: 'ready' | 'running' | 'finished' | 'waiting'

  progress: number
  total: number
  output: string
}

interface RoundRobinAPI {
  start: (processes: RoundRobinProcess[]) => Promise<void>

  onUpdate: (callback: (processes: RoundRobinProcess[]) => void) => () => void
}

interface API {
  roundRobin: RoundRobinAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
