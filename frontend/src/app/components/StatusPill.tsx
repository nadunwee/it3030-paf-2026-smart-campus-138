import type { ResourceStatus } from '@/api/resource'
import { Badge } from './ui/badge'

interface StatusPillProps {
  status: ResourceStatus
}

export function StatusPill({ status }: StatusPillProps) {
  const variant = status === 'ACTIVE' ? 'default' : 'secondary'
  const color =
    status === 'ACTIVE'
      ? 'bg-[#e7f0fb] text-[#1f4f7f] hover:bg-[#e7f0fb] border-[#bdd4ea]'
      : 'bg-[#f8ebe8] text-[#9f4336] hover:bg-[#f8ebe8] border-[#e7c1ba]'

  return (
    <Badge variant={variant} className={color}>
      {status === 'ACTIVE' ? 'Active' : 'Out of Service'}
    </Badge>
  )
}
