import { Table } from '@heroui/react'
import type { RoundRobinProcess } from '../types/types-round-robin'

export default function ResultTable({ title, rows }: { title: string; rows: RoundRobinProcess[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold mb-2">{title}</h3>

      <Table>
        <Table.ScrollContainer>
          <Table.Content>
            <Table.Header>
              <Table.Column isRowHeader>Nombre Proceso</Table.Column>
              <Table.Column>Tiempo Llegada</Table.Column>
              <Table.Column>Rafaga</Table.Column>
              <Table.Column>Prioridad Asignada</Table.Column>
              <Table.Column>turnAround</Table.Column>
              <Table.Column>Tiempo Finalizacion</Table.Column>
            </Table.Header>

            <Table.Body>
              {rows.map((p) => (
                <Table.Row key={p.pid}>
                  <Table.Cell>{p.name}</Table.Cell>
                  <Table.Cell>{p.arrivalTime}</Table.Cell>
                  <Table.Cell>{p.burst}</Table.Cell>
                  <Table.Cell>{p.preemption}</Table.Cell>
                  <Table.Cell>{p.turnaround}</Table.Cell>
                  <Table.Cell>{p.finishTime}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {rows.length === 0 && <p className="py-4 text-center text-sm text-muted">Sin procesos</p>}
    </div>
  )
}
