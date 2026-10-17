import { Card } from '@heroui/react'
import { CpuAi } from 'lucide-react'
function ProcessThread() {
  return (
    <Card className="w-50" variant="secondary">
      <Card.Header>
        <Card.Title className="flex gap-2">
          <CpuAi />
          Proceso 1
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <span>Pid: 123</span>
        <span>Quantium: 1231</span>
        <span>Ejecuciones: 21</span>
      </Card.Content>
    </Card>
  )
}
export default function SchemaSimulator() {
  return (
    <div className="grid gap-y-2">
      <div>
        <h1 className="text-xl font-bold mb-2">Listos</h1>
        <Card className="grid grid-cols-5 gap-4">
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
        </Card>
      </div>
      <Card>
        <h1 className="text-xl font-bold mb-2">Ejecucion</h1>
        <div className="grid grid-cols-5 gap-4">
          <ProcessThread />
        </div>
      </Card>
      <Card>
        <h1 className="text-xl font-bold mb-2">Espera</h1>
        <div className="grid grid-cols-5 gap-4">
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
        </div>
      </Card>
      <Card>
        <h1 className="text-xl font-bold mb-2">Terminados</h1>
        <div className="grid grid-cols-5 gap-4">
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
          <ProcessThread />
        </div>
      </Card>
    </div>
  )
}
