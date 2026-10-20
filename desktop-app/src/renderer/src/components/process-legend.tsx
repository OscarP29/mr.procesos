export default function ProcessLegend() {
  return (
    <div className="flex items-center gap-1 text-sm flex-col">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-sm bg-accent border" />
        <span>Sistema</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="size-3 rounded-sm bg-surface-secondary border" />
        <span>Usuario</span>
      </div>
    </div>
  )
}
