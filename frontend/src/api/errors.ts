// Format d'une réponse 400 de DRF : une liste de messages par champ
export type FieldErrorMap = Record<string, string[] | undefined>

// Erreur levée sur un 400 : transporte les messages de validation DRF par champ.
// Le paramètre de type décrit les champs attendus (ex. ProjectFieldErrors).
export class ValidationError<F extends FieldErrorMap = FieldErrorMap> extends Error {
  fieldErrors: F

  constructor(fieldErrors: F) {
    super('Données invalides')
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}
