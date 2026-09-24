# LabTrack — frontend

Interface React de LabTrack. L'installation, le lancement et l'architecture sont décrits dans le [README principal](../README.md).

## Organisation

- `src/api/` : appels à l'API. `apiFetch` ajoute le token JWT et le renouvelle quand il expire.
- `src/auth/` : état de connexion (`AuthProvider`, `useAuth`) et routes protégées.
- `src/pages/` et `src/components/` : écrans et composants de l'application.
- `src/components/ui/` : composants [shadcn/ui](https://ui.shadcn.com), générés par la CLI shadcn et exclus du lint.
- `src/hooks/useProjectListParams.ts` : filtres de la liste, synchronisés avec l'URL.

## Commandes (dans le conteneur)

```bash
docker compose exec frontend npm run lint    # oxlint
docker compose exec frontend npm run build   # TypeScript + build de production
```
