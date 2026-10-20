import ProcessProgress from '@/components/process-progress'
import { RoundRobinProcess } from '@/types/types-round-robin'
import { Card } from '@heroui/react'
import { CpuAi } from 'lucide-react'

type SectionsProps = {
  title: string
  items: RoundRobinProcess[]
  quantum: number
  delay: number
}

function SectionsProcess({ title, items, quantum, delay }: SectionsProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <Card className="grid grid-cols-5 gap-4">
        {items.map((process) => (
          <Card className="w-50" variant="secondary" key={process.pid}>
            <Card.Header>
              <Card.Title className="flex gap-2 capitalize">
                <CpuAi />
                {process.name}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <span>Pid: {process.pid}</span>
              <span>
                Quantium: {process.progress}/{process.total}
              </span>
              <span>Ejecuciones: {process.executions}</span>
              {process.state === 'running' && (
                <ProcessProgress process={process} quantum={quantum} delay={delay} />
              )}
            </Card.Content>
          </Card>
        ))}
      </Card>
    </div>
  )
}

type Props = {
  processes: RoundRobinProcess[]
  quantum: number
  delay: number
}

export default function SchemaSimulator({ processes, quantum, delay }: Props) {
  const sortBy = (s: string) => processes.filter((p) => p.state === s)
  return (
    <div className="grid gap-y-2">
      <SectionsProcess title="Listos" items={sortBy('ready')} quantum={quantum} delay={delay} />
      <SectionsProcess
        title="Ejecutando"
        items={sortBy('running')}
        quantum={quantum}
        delay={delay}
      />
      <SectionsProcess
        title="Finalizados"
        items={sortBy('finished')}
        quantum={quantum}
        delay={delay}
      />
    </div>
  )
}
