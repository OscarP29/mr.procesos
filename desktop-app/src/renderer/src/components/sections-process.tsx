import { Card } from '@heroui/react'
import { CpuAi } from 'lucide-react'
import ProcessProgress from '@/components/process-progress'
import { RoundRobinProcess } from '@/types/types-round-robin'

type SectionsProps = {
  title: string
  items: RoundRobinProcess[]
  quantum: number
  delay: number
}

export default function SectionsProcess({ title, items, quantum, delay }: SectionsProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <Card className="grid grid-cols-5 gap-4">
        {items.map((process) => {
          const isRunning = process.state === 'running'
          const heartbeatDuration = Number.isFinite(delay) && delay > 0 ? delay : 1000

          return (
            <Card
              className={`w-50 ${isRunning ? 'animate-heartbeat' : ''} ${process.preemption === 1 ? 'bg-accent text-white' : ''}`}
              style={isRunning ? { animationDuration: `${heartbeatDuration}ms` } : undefined}
              variant="secondary"
              key={process.pid}
            >
              <Card.Header>
                <Card.Title
                  className={`${process.preemption === 1 ? 'text-white ' : ''} flex gap-2 capitalize`}
                >
                  <CpuAi color={`${process.preemption === 1 ? 'white' : ''}`} />
                  {process.name}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <span>
                  Pid: <b>{process.pid}</b>
                </span>
                <span>
                  Quantium: {process.progress}/{process.total}
                </span>
                <span>Ejecuciones: {process.executions}</span>
                {isRunning && <ProcessProgress process={process} quantum={quantum} delay={delay} />}
              </Card.Content>
            </Card>
          )
        })}
      </Card>
    </div>
  )
}
