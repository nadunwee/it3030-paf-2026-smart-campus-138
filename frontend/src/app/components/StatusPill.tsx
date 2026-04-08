import type { ResourceStatus } from '@/api/resource'
import { Badge } from './ui/badge'

interface StatusPillProps {
  status: ResourceStatus
}

export function StatusPill({ status }: StatusPillProps) {
  const variant = status === 'ACTIVE' ? 'default' : 'secondary'
  const color =
    status === 'ACTIVE'
      ? 'bg-[#cde7b0] text-[#59594a] hover:bg-[#cde7b0] border-[#a3bfa8]'
      : 'bg-[#be6e46]/10 text-[#be6e46] hover:bg-[#be6e46]/10 border-[#be6e46]/30'

  return (
    <Badge variant={variant} className={color}>
      {status === 'ACTIVE' ? 'Active' : 'Out of Service'}
    </Badge>
  )
}
