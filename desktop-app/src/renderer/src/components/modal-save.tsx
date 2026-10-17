import { Button, Input, Label, Modal, Tooltip } from '@heroui/react'
import { Save } from 'lucide-react'

export default function ModalSave({ disable }: { disable: boolean }) {
  console.log(disable)
  return (
    <Modal>
      <Tooltip delay={0}>
        <Button isIconOnly aria-label="save">
          <Save />
        </Button>
        <Tooltip.Content showArrow placement="left">
          <p>Guardar Procesos</p>
        </Tooltip.Content>
      </Tooltip>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Save className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Guardar Procesos</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>Guarda tus procesos para acceder a ellos en el similador</p>
              <div className="my-4">
                <Label className="mb-2" isRequired>
                  Nombre
                </Label>
                <Input type="tel" placeholder="Mis Procesos" fullWidth />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button className="w-full" slot="close">
                Guardar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
