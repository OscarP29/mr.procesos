import { RoundRobinProcess } from '@/types/types-round-robin'
import SectionsProcess from './sections-process'

type Props = {
  processes: RoundRobinProcess[]
  quantum: number
  delay: number
}

export default function SchemaSimulator({ processes, quantum, delay }: Props) {
  const sortBy = (s: string) => processes.filter((p) => p.state === s)
  const ready = sortBy('ready')
  const listos = ready.filter((p) => p.executions <= 1)
  const espera = ready.filter((p) => p.executions >= 1)

  return (
    <div className="grid gap-y-2">
      <SectionsProcess title="Listos" items={listos} quantum={quantum} delay={delay} />
      <SectionsProcess title="Espera" items={espera} quantum={quantum} delay={delay} />
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
