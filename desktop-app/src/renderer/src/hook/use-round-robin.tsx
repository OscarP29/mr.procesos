import { useEffect, useState } from 'react'

import type { RoundRobinProcess } from '@/types/types-round-robin'

export function useRoundRobin() {
  const [processes, setProcesses] = useState<RoundRobinProcess[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const unsubscribe = window.api.roundRobin.onUpdate((updatedProcesses) => {
      setProcesses(updatedProcesses)
    })

    return unsubscribe
  }, [])

  const start = async (processList: RoundRobinProcess[]) => {
    setIsRunning(true)

    try {
      await window.api.roundRobin.start(processList)
    } finally {
      setIsRunning(false)
    }
  }

  return {
    processes,
    isRunning,
    start
  }
}
