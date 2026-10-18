export type ProcessPriority = 0 | 1

export type Process = {
  pid: number
  name: string
  description: string
  user: string
  cpu: number
  memory_mb: number
  preemption: ProcessPriority
}

export type ProcessResponse = {
  total: number
  processList: Process[]
}

export type CategoryResponse = {
  id: number
  name: string
  processes: ProcessResponse[]
}

export type CategorySummary = {
  id: number
  name: string
  process_count: number
}
