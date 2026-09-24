import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ORDERING_LABELS } from '@/hooks/useProjectListParams'
import {
  STATUS_LABELS,
  type ProjectListParams,
  type ProjectOrdering,
  type ProjectStatus,
} from '@/types/project'

// Le Select Radix n'accepte pas '' comme valeur : "all" représente « tous les statuts »
const ALL_STATUSES = 'all'
const SEARCH_DELAY_MS = 300

type ProjectFiltersProps = {
  params: ProjectListParams
  hasFilters: boolean
  onChange: (changes: Partial<ProjectListParams>, options?: { replace?: boolean }) => void
  onReset: () => void
}

function ProjectFilters({ params, hasFilters, onChange, onReset }: ProjectFiltersProps) {
  // Le champ affiche la frappe immédiatement ; l'URL (donc l'API) suit après une pause
  const [searchInput, setSearchInput] = useState(params.search ?? '')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Annule une recherche en attente si le composant disparaît
  useEffect(() => () => clearTimeout(timer.current), [])

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setSearchInput(value)
    // Debounce : chaque frappe repousse l'envoi de 300 ms
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => onChange({ search: value.trim() || undefined }, { replace: true }),
      SEARCH_DELAY_MS,
    )
  }

  function handleReset() {
    clearTimeout(timer.current)
    setSearchInput('')
    onReset()
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher par titre ou description…"
          aria-label="Rechercher un projet"
          value={searchInput}
          onChange={handleSearchChange}
          className="pl-8"
        />
      </div>

      <Select
        value={params.status ?? ALL_STATUSES}
        onValueChange={(value) =>
          onChange({ status: value === ALL_STATUSES ? undefined : (value as ProjectStatus) })
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par statut">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>Tous les statuts</SelectItem>
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.ordering}
        onValueChange={(value) => onChange({ ordering: value as ProjectOrdering })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Trier">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ORDERING_LABELS) as ProjectOrdering[]).map((ordering) => (
            <SelectItem key={ordering} value={ordering}>
              {ORDERING_LABELS[ordering]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" onClick={handleReset}>
          <XIcon /> Réinitialiser
        </Button>
      )}
    </div>
  )
}

export default ProjectFilters
