import { getCategories, getCategory } from '@/api/api'
import { Chart } from '@/components/Chart'
import Controls from '@/components/controls'
import EmplyState from '@/components/emply-state'
import Header from '@/components/header'
import ProcessLegend from '@/components/process-legend'
import { Results } from '@/components/results'
import SchemaSimulator from '@/components/schema-simulator'
import TableProcess from '@/components/table-process'
import TooltipInfo from '@/components/tooltip'
import { useRoundRobin } from '@/hook/use-round-robin'
import { useAppStore } from '@/store/use-store'
import { CategorySummary, ProcessResponse } from '@/types/types-api'
import { RoundRobinProcess } from '@/types/types-round-robin'
import { Button, Input, Label, ListBox, ComboBox, Spinner } from '@heroui/react'
import { Atom } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface Config {
  delay: number
  quantum: number
}

export default function Simulator() {
  const [config, setConfig] = useState<Config>({ delay: 1000, quantum: 10 })
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [categoryProcess, setCategoryProcess] = useState<ProcessResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activeDelay, setActiveDelay] = useState<number>(config.delay)
  const [activeQuantum, setActiveQuantum] = useState<number>(config.quantum)
  const { processes, status, start, pause, resume, reset } = useRoundRobin()
  const { directory } = useAppStore()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories(await getCategories())
      } catch (error) {
        console.error('No se pudieron obtener las categorías', error)
      }
    }

    loadCategories()
  }, [])

  const handlerLoad = async () => {
    if (selectedId === null) return

    reset()
    setLoading(true)
    try {
      const category = await getCategory(selectedId)

      setCategoryProcess({
        total: category.processes.length,
        processList: category.processes.map((process) => ({
          pid: process.pid,
          name: process.name,
          description: process.description,
          user: process.user,
          cpu: process.cpu,
          memory_mb: process.memory_mb ?? 0,
          preemption: process.preemption
        }))
      })
    } catch (error) {
      console.error('No se pudieron obtener los procesos de la categoría', error)
      setCategoryProcess(null)
    } finally {
      setLoading(false)
    }
  }

  const roundRobinProcess = useMemo<RoundRobinProcess[]>(
    () =>
      categoryProcess === null
        ? []
        : categoryProcess.processList.map((process): RoundRobinProcess => ({
            ...process,
            state: 'ready',
            progress: 0,
            total: process.description.length,
            executions: 0,
            output: '',
            arrivalTime: 0,
            burst: 0,
            finishTime: null,
            turnaround: null
          })),
    [categoryProcess]
  )

  const handleStart = () => {
    if (roundRobinProcess.length === 0) return

    setActiveDelay(config.delay)
    setActiveQuantum(config.quantum)
    start(roundRobinProcess, config.quantum, config.delay, directory)
  }

  return (
    <div className="grid">
      <Header icon={Atom} title="Simulador" />
      <div className="flex justify-between items-end mt-4">
        <div className="flex items-end gap-4">
          <ComboBox
            className="w-[256px]"
            isRequired
            value={selectedId}
            onChange={(key) => {
              setSelectedId(key as number | null)
              setCategoryProcess(null)
            }}
          >
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
                {categories.map((category) => (
                  <ListBox.Item
                    key={category.id}
                    id={category.id}
                    textValue={category.name}
                    value={category.name}
                  >
                    {category.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
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
              min={100}
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
              min={1}
              value={config.quantum}
              onChange={(e) =>
                setConfig((state) => ({ ...state, quantum: Number(e.target.value) }))
              }
            />
          </div>
          <Button
            isDisabled={selectedId === null || loading}
            isPending={loading}
            onPress={handlerLoad}
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? 'Cargando...' : 'Cargar'}
              </>
            )}
          </Button>
          <ProcessLegend />
        </div>
        <Controls
          disable={roundRobinProcess.length === 0}
          status={status}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onReset={reset}
        />
      </div>
      <div className="mt-4">
        {processes.length > 0 ? (
          <>
            <SchemaSimulator processes={processes} quantum={activeQuantum} delay={activeDelay} />
            <Results processes={processes} />
            <Chart processes={processes} />
          </>
        ) : categoryProcess !== null ? (
          <TableProcess processList={categoryProcess} />
        ) : (
          <EmplyState
            title="No hay procesos que simular"
            description="Selecciona una categoría y pulsa Cargar para comenzar."
          />
        )}
      </div>
    </div>
  )
}
