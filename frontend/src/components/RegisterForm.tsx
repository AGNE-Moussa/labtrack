import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ValidationError } from '@/api/errors'
import { useAuth } from '@/auth/AuthContext'
import AuthCard from '@/components/AuthCard'
import FieldErrors from '@/components/FieldErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RegisterFieldErrors, RegisterInput } from '@/types/user'

type RegisterFormState = RegisterInput & { passwordConfirm: string }

const EMPTY_FORM: RegisterFormState = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth()
  const [form, setForm] = useState<RegisterFormState>(EMPTY_FORM)

  const mutation = useMutation({
    mutationFn: (input: RegisterInput) => register(input),
  })

  // Vérifiée avant l'envoi : inutile de solliciter l'API pour une faute de frappe
  const passwordsMismatch =
    form.passwordConfirm !== '' && form.password !== form.passwordConfirm

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (passwordsMismatch) {
      return
    }
    // La confirmation ne sert qu'au navigateur : l'API ne la reçoit pas
    mutation.mutate({ username: form.username, email: form.email, password: form.password })
  }

  const fieldErrors: RegisterFieldErrors =
    mutation.error instanceof ValidationError
      ? (mutation.error.fieldErrors as RegisterFieldErrors)
      : {}

  return (
    <AuthCard
      description="Créez votre compte pour suivre vos études"
      footer={
        <>
          Déjà un compte ?
          <Button variant="link" className="px-1.5" onClick={onSwitchToLogin}>
            Se connecter
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FieldErrors messages={fieldErrors.non_field_errors} />
        {mutation.isError && !(mutation.error instanceof ValidationError) && (
          <p role="alert" className="text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}

        <div className="grid gap-2">
          <Label htmlFor="username">Identifiant</Label>
          <Input
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
            maxLength={150}
            aria-invalid={fieldErrors.username !== undefined}
          />
          <FieldErrors messages={fieldErrors.username} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">
            E-mail <span className="font-normal text-muted-foreground">(facultatif)</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            aria-invalid={fieldErrors.email !== undefined}
          />
          <FieldErrors messages={fieldErrors.email} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            aria-invalid={fieldErrors.password !== undefined}
          />
          <p className="text-xs text-muted-foreground">
            8 caractères minimum, pas entièrement numérique ni trop courant.
          </p>
          <FieldErrors messages={fieldErrors.password} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="passwordConfirm">Confirmer le mot de passe</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            autoComplete="new-password"
            required
            aria-invalid={passwordsMismatch}
          />
          {passwordsMismatch && (
            <FieldErrors messages={['Les mots de passe ne correspondent pas.']} />
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || passwordsMismatch}
        >
          {mutation.isPending ? 'Création du compte…' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default RegisterForm
