import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, type ProjectStatus } from '@/types/project'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: 'border-slate-300 bg-slate-100 text-slate-700',
  active: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  closed: 'border-violet-300 bg-violet-50 text-violet-700',
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export default StatusBadge
