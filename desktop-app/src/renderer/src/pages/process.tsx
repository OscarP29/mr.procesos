import { getProcess } from '@/api/api'
import Header from '@/components/header'
import ModalSave from '@/components/modal-save'
import EmplyState from '@/components/emply-state'
import TableProcess from '@/components/table-process'
import TooltipInfo from '@/components/tooltip'
import { ProcessResponse } from '@/types/types-api'
import { Input, Label, ComboBox, ListBox, Button, Spinner } from '@heroui/react'
import { Cpu, Search } from 'lucide-react'
import { useState } from 'react'

export default function ProcessPage() {
  const [process, setProcess] = useState<ProcessResponse | null>(null)
  const [filter, setFilter] = useState<string>('cpu')
  const [limit, setLimit] = useState<number>(10)
  const [loading, setLoading] = useState<boolean>(false)

  const handlerProcess = async () => {
    setLoading(true)
    try {
      const response = await getProcess(limit)

      response.processList = response.processList.map((process) => ({
        ...process,
        name: process.name.trim() === '' ? 'unknown' : process.name
      }))

      setProcess(response)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="grid">
      <Header icon={Cpu} title="Procesos" />
      <div className="flex justify-between items-end mt-4">
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <div className="flex gap-1 items-start">
              <TooltipInfo description="Cantidad de procesos a obtener el sistema, el limite es 500" />
              <Label className="mb-1" isRequired>
                Numero de procesos
              </Label>
            </div>
            <Input
              type="tel"
              placeholder="Procesos"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <ComboBox
            className="w-[256px]"
            defaultInputValue="Cpu"
            isRequired
            onInputChange={setFilter}
          >
            <div className="flex gap-1 items-start">
              <TooltipInfo description="Cualidades de la busqueda de procesos" />
              <Label isRequired>Buscar por</Label>
            </div>
            <ComboBox.InputGroup>
              <Input placeholder="Cpu..." />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>
                <ListBox.Item id="aardvark" textValue="Cpu" value="cpu">
                  Cpu
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="cat" textValue="Memoria" value="mem">
                  Memoria
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <Button isPending={loading} isDisabled={loading} onPress={handlerProcess}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <Search className="size-4" />}
                {isPending ? 'Buscando...' : 'Buscar'}
              </>
            )}
          </Button>
        </div>
        <ModalSave
          disable={process === null}
          processes={process !== null ? process.processList : []}
        />
      </div>
      <div className="mt-4">
        {process === null || process.total === 0 ? (
          <EmplyState />
        ) : (
          <TableProcess processList={process} />
        )}
      </div>
    </div>
  )
}
