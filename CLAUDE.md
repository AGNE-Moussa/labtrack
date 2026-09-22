# LabTrack

Application de gestion d'études de recherche (projets, expériences, sessions, participants).

## Stack
- Backend : Django + Django REST Framework, PostgreSQL 16 (`backend/`)
- Frontend : React + Vite (`frontend/`, à venir)
- Tout tourne dans Docker Compose : services `backend` et `db`

## Commandes
- Démarrer : `docker compose up -d`
- Django : TOUJOURS via `docker compose exec backend python manage.py <commande>`,
  jamais avec le Python local
- Nouvelle dépendance : l'ajouter à `backend/requirements.txt`,
  puis `docker compose up -d --build`

## Conventions
- Commits : Conventional Commits en français (feat, fix, chore, docs, refactor, test)
- Une branche par tâche (`feature/…`, `fix/…`), fusion dans `main` avec `--no-ff`
- Ne jamais lire ni modifier `.env` ; toute nouvelle variable va dans `.env.example`
