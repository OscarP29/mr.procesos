import type { RoundRobinProcess } from '../types/types-round-robin'
import ResultTable from './table-results'

export function Results({ processes }: { processes: RoundRobinProcess[] }) {
  return (
    <div className="space-y-6 mt-4">
      <ResultTable title="Procesos expulsivos" rows={processes.filter((p) => !p.preemption)} />

      <ResultTable title="Procesos no expulsivos" rows={processes.filter((p) => p.preemption)} />
    </div>
  )
}
