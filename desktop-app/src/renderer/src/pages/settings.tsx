import { Settings2, Sun, Moon, FolderOpen, Folder, Check } from 'lucide-react'

import { Button, Card, Separator } from '@heroui/react'
import { useAppStore } from '@/store/use-store'
import Header from '@/components/header'

const themes = [
  {
    value: 'light',
    label: 'Claro',
    icon: Sun
  },
  {
    value: 'dark',
    label: 'Oscuro',
    icon: Moon
  }
] as const

export default function PageSettings() {
  const { theme, directory, setTheme, setDirectory } = useAppStore()

  const handleSelectDirectory = async () => {
    const selectedDirectory = await window.api.selectDirectory()

    if (selectedDirectory) {
      setDirectory(selectedDirectory)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6">
      {/* Header */}
      <Header
        icon={Settings2}
        title="Configuracion"
        description=" Personaliza la apariencia y el almacenamiento de la aplicación."
      />

      <Card>
        <Card.Content className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Apariencia</h2>

            <p className="mt-1 text-sm text-muted">
              Selecciona cómo quieres visualizar la aplicación.
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            {themes.map((item) => {
              const Icon = item.icon
              const selected = theme === item.value

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={`
                    relative flex cursor-pointer flex-col items-center
                    justify-center gap-3 rounded-xl border p-5
                    transition-colors
                    ${selected ? 'border-accent bg-accent/10' : 'border-default hover:bg-default/5'}
                  `}
                >
                  {selected && <Check className="absolute right-3 top-3 size-4 text-accent" />}

                  <Icon className={`size-6 ${selected ? 'text-accent' : 'text-muted'}`} />

                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Almacenamiento</h2>

            <p className="mt-1 text-sm text-muted">
              Configura dónde se guardarán los archivos de la aplicación. Se acoseja tener una
              carpeta vacia donde se guarde, la app borrar todo el contenido en cada simulacion
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <label className="text-sm font-medium">Directorio de almacenamiento</label>

            <div className="flex items-center gap-3 rounded-lg border border-default p-3">
              <Folder className="size-5 shrink-0 text-muted" />

              <span className="min-w-0 flex-1 truncate text-sm text-muted">
                {directory || 'No se ha seleccionado un directorio'}
              </span>

              <Button variant="secondary" size="sm" onPress={handleSelectDirectory}>
                <FolderOpen className="size-4" />
                Examinar
              </Button>
            </div>

            <p className="text-xs text-muted">
              Los archivos generados se guardarán en esta ubicación.
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
