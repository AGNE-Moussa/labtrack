import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, updateProject, ValidationError } from '../api/projects'
import {
  STATUS_LABELS,
  type Project,
  type ProjectFieldErrors,
  type ProjectInput,
  type ProjectStatus,
} from '../types/project'

const EMPTY_FORM: ProjectInput = {
  title: '',
  description: '',
  status: 'draft',
  start_date: null,
}

function FieldErrors({ messages }: { messages?: string[] }) {
  if (!messages) {
    return null
  }

  return (
    <>
      {messages.map((message) => (
        <p key={message} role="alert">
          {message}
        </p>
      ))}
    </>
  )
}

type ProjectFormProps = {
  // Projet à modifier ; absent = création
  project?: Project
  // Appelé après un enregistrement réussi ou une annulation en mode édition
  onDone?: () => void
}

function ProjectForm({ project, onDone }: ProjectFormProps) {
  const queryClient = useQueryClient()
  const isEditing = project !== undefined

  // useState ne lit cette valeur qu'au premier rendu : le parent doit changer
  // la key du composant pour pré-remplir avec un autre projet
  const [form, setForm] = useState<ProjectInput>(
    isEditing
      ? {
          title: project.title,
          description: project.description,
          status: project.status,
          start_date: project.start_date,
        }
      : EMPTY_FORM,
  )

  const mutation = useMutation({
    mutationFn: (input: ProjectInput) =>
      isEditing ? updateProject(project.id, input) : createProject(input),
    onSuccess: () => {
      // La liste est périmée : ProjectList refera son GET automatiquement
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (isEditing) {
        onDone?.()
      } else {
        setForm(EMPTY_FORM)
      }
    },
  })

  // Un seul handler pour tous les champs, grâce à l'attribut name
  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      // Un input date vide vaut '' alors que l'API attend null
      [name]: name === 'start_date' && value === '' ? null : value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate(form)
  }

  const fieldErrors: ProjectFieldErrors =
    mutation.error instanceof ValidationError ? mutation.error.fieldErrors : {}

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? `Modifier « ${project.title} »` : 'Nouveau projet'}</h2>

      <FieldErrors messages={fieldErrors.non_field_errors} />
      {mutation.isError && !(mutation.error instanceof ValidationError) && (
        <p role="alert">
          Impossible {isEditing ? 'de modifier' : 'de créer'} le projet :{' '}
          {mutation.error.message}
        </p>
      )}

      <div>
        <label htmlFor="title">Titre</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          maxLength={200}
        />
        <FieldErrors messages={fieldErrors.title} />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
        <FieldErrors messages={fieldErrors.description} />
      </div>

      <div>
        <label htmlFor="status">Statut</label>
        <select id="status" name="status" value={form.status} onChange={handleChange}>
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <FieldErrors messages={fieldErrors.status} />
      </div>

      <div>
        <label htmlFor="start_date">Date de début</label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          value={form.start_date ?? ''}
          onChange={handleChange}
        />
        <FieldErrors messages={fieldErrors.start_date} />
      </div>

      {isEditing ? (
        <>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={onDone} disabled={mutation.isPending}>
            Annuler
          </button>
        </>
      ) : (
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Création…' : 'Créer le projet'}
        </button>
      )}
    </form>
  )
}

export default ProjectForm
