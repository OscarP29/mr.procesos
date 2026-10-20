import { RoundRobinProcess } from '@/types/types-round-robin'
import { ProgressBar } from '@heroui/react'
import { useState } from 'react'

type Props = {
  process: RoundRobinProcess
  quantum: number
  delay: number
}

export default function ProcessProgress({ process, quantum, delay }: Props) {
  const [chars] = useState(() => {
    const remaining = Math.max(process.total - process.progress, 0)
    const limit = Number.isFinite(quantum) ? Math.max(quantum, 0) : remaining

    return process.preemption === 1 ? remaining : Math.min(limit, remaining)
  })

  const duration = Number.isFinite(delay) ? chars * Math.max(delay, 0) : 0

  return (
    <ProgressBar
      aria-label="Progreso del proceso"
      value={process.progress}
      maxValue={Math.max(process.total, 1)}
      size="sm"
      className="w-full"
    >
      <ProgressBar.Track className="w-full overflow-hidden">
        <ProgressBar.Fill
          className="h-full transition-[width] motion-reduce:transition-none"
          style={{
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: chars > 0 ? `steps(${chars})` : 'linear'
          }}
        />
      </ProgressBar.Track>
    </ProgressBar>
  )
}
