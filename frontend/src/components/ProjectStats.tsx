import { useQuery } from '@tanstack/react-query'
import { fetchProjectStats } from '@/api/projects'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, type ProjectStatus } from '@/types/project'

type StatKey = ProjectStatus | 'total'

const CARDS: { key: StatKey; label: string; accent: string }[] = [
  { key: 'total', label: 'Total', accent: 'bg-primary' },
  { key: 'draft', label: STATUS_LABELS.draft, accent: 'bg-slate-400' },
  { key: 'active', label: STATUS_LABELS.active, accent: 'bg-emerald-500' },
  { key: 'closed', label: STATUS_LABELS.closed, accent: 'bg-violet-500' },
]

type ProjectStatsProps = {
  // Statut filtré actuellement (undefined = tous) : la carte correspondante est mise en avant
  activeStatus?: ProjectStatus
  onSelect: (status: ProjectStatus | undefined) => void
}

// Compteurs par statut ; un clic sur une carte filtre la liste
function ProjectStats({ activeStatus, onSelect }: ProjectStatsProps) {
  // Clé sous ['projects'] : créer/modifier/supprimer un projet rafraîchit aussi les compteurs
  const { data: stats } = useQuery({
    queryKey: ['projects', 'stats'],
    queryFn: fetchProjectStats,
  })

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARDS.map(({ key, label, accent }) => {
        const status = key === 'total' ? undefined : key
        const isActive = activeStatus === status

        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(status)}
            className={cn(
              'flex flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent',
              isActive && 'border-primary ring-1 ring-primary',
            )}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn('size-2 rounded-full', accent)} />
              {label}
            </span>
            {stats ? (
              <span className="text-2xl font-semibold tabular-nums">{stats[key]}</span>
            ) : (
              <Skeleton className="h-8 w-10" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ProjectStats
