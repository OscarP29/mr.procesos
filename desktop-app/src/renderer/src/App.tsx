import '@/global.css'
import { Tabs } from '@heroui/react'
import { Settings, Cpu, Atom } from 'lucide-react'
import ProcessPage from './pages/process'

const listClassName = [
  'rounded-xl border border-accent/10 bg-accent-soft/30 p-1',
  '**:data-[slot=tabs-tab]:rounded-lg',
  '**:data-[slot=tabs-tab]:bg-transparent',
  '**:data-[slot=tabs-tab]:text-muted',
  '**:data-[slot=tabs-tab]:opacity-100',
  '**:data-[slot=tabs-tab]:transition-colors',
  '**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:bg-accent-soft',
  '**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:text-accent-soft-foreground',
  '**:data-[slot=tabs-tab]:data-[pressed=true]:not-data-[selected=true]:bg-accent-soft-hover',
  '**:data-[slot=tabs-tab]:data-[focus-visible=true]:ring-2',
  '**:data-[slot=tabs-tab]:data-[focus-visible=true]:ring-accent/15',
  '**:data-[slot=tabs-tab]:data-[selected=true]:font-medium',
  '**:data-[slot=tabs-tab]:data-[selected=true]:text-accent-foreground',
  '**:data-[slot=tabs-tab]:shadow-none',
  '**:data-[slot=tabs-indicator]:rounded-lg',
  '**:data-[slot=tabs-indicator]:bg-accent',
  '**:data-[slot=tabs-indicator]:shadow-none'
].join(' ')

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-background text-foreground">
      <Tabs className="w-full h-full flex flex-row" orientation="vertical">
        <Tabs.ListContainer className="h-full p-2 min-w-50">
          <Tabs.List aria-label="Options" className={`flex flex-col gap-1 ${listClassName}`}>
            <Tabs.Tab id="overview" className="flex gap-2 py-2 px-3 justify-start items-center">
              <Cpu className="w-5 h-5" />
              Procesos
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="analytics" className="flex gap-2 py-2 px-3 justify-start items-center">
              <Atom className="w-5 h-5" />
              Simulacion
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="reports" className="flex gap-2 py-2 px-3 justify-start items-center">
              <Settings className="w-5 h-5" />
              Configuracion
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {/* Panel principal que toma el espacio restante */}
        <Tabs.Panel className="flex-1 h-full p-4 overflow-auto" id="overview">
          <ProcessPage />
        </Tabs.Panel>

        <Tabs.Panel className="flex-1 h-full p-4 overflow-auto" id="analytics">
          <p>Track your metrics and analyze performance data.</p>
        </Tabs.Panel>

        <Tabs.Panel className="flex-1 h-full p-4 overflow-auto" id="reports">
          <p>Generate and download detailed reports.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
