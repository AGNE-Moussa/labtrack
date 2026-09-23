import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, ValidationError } from '../api/projects'
import {
  STATUS_LABELS,
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

function ProjectForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProjectInput>(EMPTY_FORM)

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // La liste est périmée : ProjectList refera son GET automatiquement
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setForm(EMPTY_FORM)
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
      <h2>Nouveau projet</h2>

      <FieldErrors messages={fieldErrors.non_field_errors} />
      {mutation.isError && !(mutation.error instanceof ValidationError) && (
        <p role="alert">Impossible de créer le projet : {mutation.error.message}</p>
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

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Création…' : 'Créer le projet'}
      </button>
    </form>
  )
}

export default ProjectForm
