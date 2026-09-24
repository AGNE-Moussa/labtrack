// Miroir de CurrentUserSerializer (backend/accounts/serializers.py)
export type CurrentUser = {
  id: number
  username: string
}

// Champs envoyés à /api/register/ (miroir de RegisterSerializer)
export type RegisterInput = {
  username: string
  email: string
  password: string
}

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterInput | 'non_field_errors', string[]>
>
