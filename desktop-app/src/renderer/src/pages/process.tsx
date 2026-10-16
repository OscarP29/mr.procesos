// import ModalSave from '@/components/modal-save'
import EmplyState from '@/components/emply-state'
import TooltipInfo from '@/components/tooltip'
import { Input, Label, ComboBox, ListBox, Button } from '@heroui/react'

export default function ProcessPage() {
  return (
    <div className="grid">
      <div className="flex items-end gap-4">
        <div className="flex flex-col">
          <div className="flex gap-1 items-start">
            <TooltipInfo description="Cantidad de procesos a obtener el sistema, el limite es 500" />
            <Label className="mb-1" isRequired>
              Numero de procesos
            </Label>
          </div>
          <Input type="tel" placeholder="Procesos" />
        </div>
        <ComboBox className="w-[256px]" defaultInputValue="Cpu" isRequired>
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
              <ListBox.Item id="aardvark" textValue="Cpu">
                Cpu
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="cat" textValue="Memoria">
                Memoria
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <Button>Buscar</Button>
        {/* <ModalSave /> */}
      </div>
      <div>
        <EmplyState />
      </div>
    </div>
  )
}
