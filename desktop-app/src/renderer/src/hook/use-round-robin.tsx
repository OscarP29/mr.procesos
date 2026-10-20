import { useEffect, useState } from 'react'
import type { RoundRobinProcess } from '@/types/types-round-robin'

type Status = 'idle' | 'running' | 'paused' | 'finished'

export function useRoundRobin() {
  const [processes, setProcesses] = useState<RoundRobinProcess[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return window.api.roundRobin.onUpdate((data) => {
      setProcesses(data.processes)
      setStatus(data.status as Status)
    })
  }, [])

  const start = async (
    list: RoundRobinProcess[],
    quantum: number,
    delay: number,
    outputDir?: string
  ) => {
    try {
      setError(null)
      await window.api.roundRobin.start({ processes: list, quantum, delay, outputDir })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return {
    processes,
    status,
    error,
    start,
    pause: () => window.api.roundRobin.pause(),
    resume: () => window.api.roundRobin.resume(),
    reset: () => window.api.roundRobin.reset()
  }
}
