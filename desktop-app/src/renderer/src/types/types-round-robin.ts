export type ProcessPriority = 0 | 1
export type ProcessStatus = 'ready' | 'running' | 'finished' | 'waiting'

export interface RoundRobinProcess {
  pid: number
  nombre: string
  descripcion: string
  usuario: string
  prioridad: ProcessPriority

  status: ProcessStatus

  progress: number
  total: number

  output: string
}

export interface RoundRobinConfig {
  quantum: number
  delay: number
}
