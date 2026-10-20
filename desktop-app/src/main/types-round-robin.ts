export type ProcessPriority = 0 | 1
export type ProcessStatus = 'ready' | 'running' | 'finished' | 'waiting'

export interface RoundRobinProcess {
  pid: number
  name: string
  description: string
  user: string
  preemption: ProcessPriority

  state: ProcessStatus

  progress: number
  total: number
  executions: number
  output: string
  arrivalTime: number
  burst: number
  finishTime: number | null
  turnaround: number | null
}

export interface RoundRobinConfig {
  quantum: number
  delay: number
  outputDir?: string
}
