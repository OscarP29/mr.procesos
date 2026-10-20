import type { LucideIcon } from 'lucide-react'

interface HeaderProps {
  icon: LucideIcon
  title: string
  description?: string
}

export default function Header({ icon: Icon, title, description }: HeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Icon className="size-6" />
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>

      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  )
}
