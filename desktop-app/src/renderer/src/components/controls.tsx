import { Button } from '@heroui/react'
import { Pause, Play, Undo } from 'lucide-react'

type Props = {
  status: 'idle' | 'running' | 'paused' | 'finished'
  disable?: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

export default function Controls({
  status,
  disable = false,
  onStart,
  onPause,
  onReset,
  onResume
}: Props) {
  const handleSimulator = () => {
    if (status === 'idle') {
      onStart()
    } else if (status === 'paused') {
      onResume()
    } else {
      onPause()
    }
  }

  return (
    <div className="flex gap-2">
      <Button isIconOnly onClick={handleSimulator} isDisabled={disable || status === 'finished'}>
        {status === 'idle' ? <Play /> : <Pause />}
      </Button>

      <Button isIconOnly variant="secondary" onClick={onReset} isDisabled={status === 'idle'}>
        <Undo />
      </Button>
    </div>
  )
}
