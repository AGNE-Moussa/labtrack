import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteProject } from '@/api/projects'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Project } from '@/types/project'

type DeleteProjectDialogProps = {
  // Projet à supprimer ; null = boîte fermée
  project: Project | null
  onOpenChange: (open: boolean) => void
  onDeleted?: (project: Project) => void
}

function DeleteProjectDialog({ project, onOpenChange, onDeleted }: DeleteProjectDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (target: Project) => deleteProject(target.id),
    onSuccess: (_data, deleted) => {
      // Le cache ["projects"] est périmé : on force un nouveau GET de la liste
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Projet « ${deleted.title} » supprimé`)
      onOpenChange(false)
      onDeleted?.(deleted)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AlertDialog open={project !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le projet « {project?.title} » sera définitivement supprimé. Cette action est
            irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Annuler</AlertDialogCancel>
          {/* Pas d'AlertDialogAction : il fermerait la boîte avant la fin de la requête */}
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => project && mutation.mutate(project)}
          >
            {mutation.isPending ? 'Suppression…' : 'Supprimer'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteProjectDialog
