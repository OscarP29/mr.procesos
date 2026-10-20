import { RoundRobinProcess } from '@/types/types-round-robin'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

export function Chart({ processes }: { processes: RoundRobinProcess[] }) {
  const data = processes.map((p) => ({
    name: p.name,
    turnaround: p.turnaround ?? 0
  }))

  return (
    <div className="my-4 w-full min-w-0">
      <h1 className="mb-4 text-xl font-bold">TurnAround vs Procesos</h1>

      <div className="h-112 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              label={{
                value: 'Turnaround (ms)',
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="turnaround" fill="#693585" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
