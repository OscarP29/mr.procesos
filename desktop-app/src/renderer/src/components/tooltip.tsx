import { Tooltip } from '@heroui/react'
import { Info } from 'lucide-react'

export default function TooltipInfo({ description }: { description: string }) {
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label="Info icon">
        <div>
          <Info size={16} />
        </div>
      </Tooltip.Trigger>

      <Tooltip.Content showArrow placement="right">
        <p>{description}</p>
      </Tooltip.Content>
    </Tooltip>
  )
}
