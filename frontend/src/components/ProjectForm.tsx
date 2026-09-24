import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ValidationError } from '@/api/errors'
import { createProject, updateProject } from '@/api/projects'
import FieldErrors from '@/components/FieldErrors'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  STATUS_LABELS,
  type Project,
  type ProjectFieldErrors,
  type ProjectInput,
  type ProjectStatus,
} from '@/types/project'

const EMPTY_FORM: ProjectInput = {
  title: '',
  description: '',
  status: 'draft',
  start_date: null,
}

type ProjectFormProps = {
  // Projet à modifier ; absent = création
  project?: Project
  // Appelé après un enregistrement réussi (ferme la modale)
  onDone?: () => void
}

// Le formulaire vit dans un Dialog : Radix démonte le contenu à la fermeture,
// donc useState repart de zéro à chaque ouverture.
function ProjectForm({ project, onDone }: ProjectFormProps) {
  const queryClient = useQueryClient()
  const isEditing = project !== undefined

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
    onSuccess: (saved) => {
      // La liste est périmée : ProjectList refera son GET automatiquement
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(
        isEditing ? `Projet « ${saved.title} » modifié` : `Projet « ${saved.title} » créé`,
      )
      onDone?.()
    },
  })

  // Un seul handler pour les champs natifs, grâce à l'attribut name
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      // Un input date vide vaut '' alors que l'API attend null
      [name]: name === 'start_date' && value === '' ? null : value,
    }))
  }

  // Le Select Radix n'émet pas d'événement change : il donne directement la valeur
  function handleStatusChange(status: string) {
    setForm((previous) => ({ ...previous, status: status as ProjectStatus }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate(form)
  }

  const fieldErrors: ProjectFieldErrors =
    mutation.error instanceof ValidationError
      ? (mutation.error.fieldErrors as ProjectFieldErrors)
      : {}

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FieldErrors messages={fieldErrors.non_field_errors} />
      {mutation.isError && !(mutation.error instanceof ValidationError) && (
        <p role="alert" className="text-sm text-destructive">
          Impossible {isEditing ? 'de modifier' : 'de créer'} le projet :{' '}
          {mutation.error.message}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          maxLength={200}
          aria-invalid={fieldErrors.title !== undefined}
        />
        <FieldErrors messages={fieldErrors.title} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          aria-invalid={fieldErrors.description !== undefined}
        />
        <FieldErrors messages={fieldErrors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={form.status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrors messages={fieldErrors.status} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="start_date">Date de début</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={form.start_date ?? ''}
            onChange={handleChange}
            aria-invalid={fieldErrors.start_date !== undefined}
          />
          <FieldErrors messages={fieldErrors.start_date} />
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={mutation.isPending}>
            Annuler
          </Button>
        </DialogClose>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Enregistrement…'
            : isEditing
              ? 'Enregistrer'
              : 'Créer le projet'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default ProjectForm
