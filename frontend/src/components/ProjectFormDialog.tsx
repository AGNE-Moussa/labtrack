import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Project } from '@/types/project'
import ProjectForm from './ProjectForm'

type ProjectFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Projet à modifier ; absent = création
  project?: Project
}

function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? `Modifier « ${project.title} »` : 'Nouveau projet'}
          </DialogTitle>
          <DialogDescription>
            {project
              ? 'Mettez à jour les informations du projet.'
              : 'Renseignez les informations de votre nouvelle étude.'}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm project={project} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export default ProjectFormDialog
