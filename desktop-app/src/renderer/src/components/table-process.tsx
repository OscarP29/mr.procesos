import { ProcessResponse } from '@/types/process'
import { Table } from '@heroui/react'

export default function TableProcess({ processList }: { processList: ProcessResponse }) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Process list" className="min-w-150">
          <Table.Header>
            <Table.Column isRowHeader>PID</Table.Column>
            <Table.Column>NOMBRE</Table.Column>
            <Table.Column>DESCRIPCION</Table.Column>
            <Table.Column>USUARIO</Table.Column>
            <Table.Column>CPU</Table.Column>
            <Table.Column>MEMORIA (MB)</Table.Column>
            <Table.Column>PRIORIDAD</Table.Column>
          </Table.Header>
          <Table.Body>
            {processList.processList.map((process) => (
              <Table.Row key={process.pid}>
                <Table.Cell>{process.pid}</Table.Cell>
                <Table.Cell>{process.nombre}</Table.Cell>
                <Table.Cell>{process.descripcion}</Table.Cell>
                <Table.Cell>
                  <span
                    className={`${process.usuario === 'NT AUTHORITY\\SYSTEM' ? 'bg-process-system  ' : 'bg-process-user'} text-accent-foreground px-2 py-1 `}
                  >
                    {process.usuario}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-accent-foreground font-bold px-2 py-1 bg-process-cpu">
                    {process.cpu}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-accent-foreground font-bold px-2 py-1 bg-process-ram">
                    {process.memoria_mb}
                  </span>
                </Table.Cell>
                <Table.Cell>{process.prioridad}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
