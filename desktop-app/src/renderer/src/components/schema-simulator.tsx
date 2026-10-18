import { RoundRobinProcess } from '@/types/types-round-robin'
import { Card } from '@heroui/react'
import { CpuAi } from 'lucide-react'
function SectionsProcess({ title, items }: { title: string; items: RoundRobinProcess[] }) {
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
                Quantium: {process.description.length}/{process.progress}
              </span>
              <span>Ejecuciones: {process.executions}</span>
            </Card.Content>
          </Card>
        ))}
      </Card>
    </div>
  )
}
export default function SchemaSimulator({ processes }: { processes: RoundRobinProcess[] }) {
  const sortBy = (s: string) => processes.filter((p) => p.state === s)
  return (
    <div className="grid gap-y-2">
      <SectionsProcess title="Listos" items={sortBy('ready')} />
      <SectionsProcess title="Ejecutando" items={sortBy('running')} />
      <SectionsProcess title="Finalizados" items={sortBy('finished')} />
    </div>
  )
}
