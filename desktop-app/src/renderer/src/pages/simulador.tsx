import Controls from '@/components/controls'
import SchemaSimulator from '@/components/schema-simulator'
import TooltipInfo from '@/components/tooltip'
import { useRoundRobin } from '@/hook/use-round-robin'
import { dataExample } from '@/types/process'
import { RoundRobinProcess } from '@/types/types-round-robin'
import { Button, Input, Label, ListBox, ComboBox } from '@heroui/react'
import { useState } from 'react'

interface Config {
  delay: number
  quantum: number
}

const listProcess: RoundRobinProcess[] = dataExample.processList.map((item) => ({
  ...item,
  state: 'ready',

  progress: 0,
  total: item.description.length,
  executions: 0,
  output: ''
}))

export default function Simulator() {
  const [config, setConfig] = useState<Config>({ delay: 1000, quantum: 10 })
  const { processes, status, start, pause, resume, reset } = useRoundRobin()

  return (
    <div className="grid">
      <div className="flex justify-between items-end">
        <div className="flex items-end gap-4">
          <ComboBox className="w-[256px]" isRequired>
            <div className="flex gap-1 items-start">
              <TooltipInfo description="Categorias de procesos guardas anteriormente" />
              <Label isRequired>Categorias</Label>
            </div>
            <ComboBox.InputGroup>
              <Input placeholder="Mi Procesos" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>
                <ListBox.Item id="aardvark" textValue="Mis Procesos 1">
                  Mis Procesos 1
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="cat" textValue="Mis Procesos 2">
                  Mis Procesos 2
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <div className="flex flex-col">
            <div className="flex gap-1 items-start">
              <TooltipInfo description="Unidad de tiempo que define la velocidad de simulacion en milisegundos" />
              <Label className="mb-1" isRequired>
                Velocidad (ms)
              </Label>
            </div>
            <Input
              type="tel"
              placeholder="Procesos"
              value={config.delay}
              onChange={(e) => setConfig((state) => ({ ...state, delay: Number(e.target.value) }))}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex gap-1 items-start">
              <TooltipInfo description="Unidad de tiempo que define la velocidad de simulacion en milisegundos" />
              <Label className="mb-1" isRequired>
                Quantium
              </Label>
            </div>
            <Input
              type="tel"
              placeholder="1"
              value={config.quantum}
              onChange={(e) =>
                setConfig((state) => ({ ...state, quantum: Number(e.target.value) }))
              }
            />
          </div>
          <Button onClick={() => console.log(config)}>Cargar</Button>
          {/* <ModalSave /> */}
        </div>
        <Controls
          status={status}
          onStart={() => start(listProcess, config.quantum, config.delay)}
          onPause={pause}
          onResume={resume}
          onReset={reset}
        />
      </div>
      <div className="mt-4">
        {/* <EmplyState /> */}
        <SchemaSimulator processes={processes} />
      </div>
    </div>
  )
}
