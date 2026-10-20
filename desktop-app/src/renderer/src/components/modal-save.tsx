import { saveCategory } from '@/api/api'
import { Process } from '@/types/types-api'
import { Alert, Button, Input, Label, Modal, Spinner, Tooltip } from '@heroui/react'
import { Save } from 'lucide-react'
import { useState } from 'react'

export default function ModalSave({
  disable,
  processes
}: {
  disable: boolean
  processes: Process[]
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<'success' | 'conflict' | 'error' | null>(null)

  const handlerCreate = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const result = await saveCategory(name, processes)
      setFeedback(result)
    } catch (error) {
      console.error('No se pudo guardar la categoría', error)
      setFeedback('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal>
      <Tooltip delay={0}>
        <Modal.Trigger>
          <Button
            isIconOnly
            aria-label="save"
            isDisabled={disable}
            onPress={() => setFeedback(null)}
          >
            <Save />
          </Button>
        </Modal.Trigger>
        <Tooltip.Content showArrow placement="left">
          <p>Guardar Procesos</p>
        </Tooltip.Content>
      </Tooltip>
      <Modal.Backdrop isDismissable={!loading} isKeyboardDismissDisabled>
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
                <Input
                  type="tel"
                  placeholder="Mis Procesos"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </Modal.Body>
            {feedback && (
              <Alert
                className="mb-4"
                status={
                  feedback === 'success'
                    ? 'success'
                    : feedback === 'conflict'
                      ? 'warning'
                      : 'danger'
                }
              >
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>
                    {feedback === 'success'
                      ? 'Categoría guardada'
                      : feedback === 'conflict'
                        ? 'Nombre duplicado'
                        : 'Error al guardar'}
                  </Alert.Title>
                </Alert.Content>
              </Alert>
            )}
            <Modal.Footer>
              <Button
                className="w-full"
                isDisabled={name.trim() === '' || loading}
                isPending={loading}
                onPress={handlerCreate}
              >
                {({ isPending }) => (
                  <>
                    {isPending && <Spinner color="current" size="sm" />}
                    {isPending ? 'Guardando...' : 'Guardar'}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
