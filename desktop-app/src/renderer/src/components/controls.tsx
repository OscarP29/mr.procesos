import { Button } from '@heroui/react'
import { Play, Undo } from 'lucide-react'

export default function Controls() {
  return (
    <div className="flex gap-2">
      <Button isIconOnly>
        <Play />
      </Button>
      <Button isIconOnly variant="secondary">
        <Undo />
      </Button>
    </div>
  )
}
