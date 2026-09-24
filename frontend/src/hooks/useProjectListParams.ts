import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import {
  STATUS_LABELS,
  type ProjectListParams,
  type ProjectOrdering,
  type ProjectStatus,
} from '@/types/project'

export const ORDERING_LABELS: Record<ProjectOrdering, string> = {
  '-created_at': 'Plus récents',
  created_at: 'Plus anciens',
  title: 'Titre (A → Z)',
  '-title': 'Titre (Z → A)',
  start_date: 'Date de début',
}

const DEFAULT_ORDERING: ProjectOrdering = '-created_at'

function isStatus(value: string | null): value is ProjectStatus {
  return value !== null && value in STATUS_LABELS
}

function isOrdering(value: string | null): value is ProjectOrdering {
  return value !== null && value in ORDERING_LABELS
}

// Les filtres de la liste vivent dans l'URL (?status=active&search=…&page=2) :
// le lien se partage, F5 les conserve et le bouton Précédent les annule.
export function useProjectListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  // L'URL est une saisie libre : on ignore les valeurs inconnues
  const rawPage = Number(searchParams.get('page'))
  const rawStatus = searchParams.get('status')
  const rawOrdering = searchParams.get('ordering')

  const params: ProjectListParams = {
    page: Number.isInteger(rawPage) && rawPage > 1 ? rawPage : 1,
    status: isStatus(rawStatus) ? rawStatus : undefined,
    search: searchParams.get('search') || undefined,
    ordering: isOrdering(rawOrdering) ? rawOrdering : DEFAULT_ORDERING,
  }

  // Met à jour certains paramètres ; tout changement de filtre repart page 1.
  // replace : la frappe dans la recherche ne remplit pas l'historique.
  const updateParams = useCallback(
    (changes: Partial<ProjectListParams>, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(changes)) {
            const isDefault =
              value === undefined ||
              value === '' ||
              (key === 'page' && value === 1) ||
              (key === 'ordering' && value === DEFAULT_ORDERING)
            if (isDefault) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }
          if (!('page' in changes)) {
            next.delete('page')
          }
          return next
        },
        { replace: options.replace },
      )
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => setSearchParams({}), [setSearchParams])

  const hasFilters = params.status !== undefined || params.search !== undefined

  return { params, updateParams, resetFilters, hasFilters }
}
