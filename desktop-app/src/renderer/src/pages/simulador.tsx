import Controls from '@/components/controls'
import SchemaSimulator from '@/components/schema-simulator'
import TooltipInfo from '@/components/tooltip'
import { Button, Input, Label, ListBox, ComboBox } from '@heroui/react'

export default function Simulator() {
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
            <Input type="tel" placeholder="Procesos" />
          </div>
          <Button>Cargar</Button>
          {/* <ModalSave /> */}
        </div>
        <Controls />
      </div>
      <div className="mt-4">
        {/* <EmplyState /> */}
        <SchemaSimulator />
      </div>
    </div>
  )
}
