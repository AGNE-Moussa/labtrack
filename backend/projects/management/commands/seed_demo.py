from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from projects.models import Project

User = get_user_model()

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "labtrack-demo"

# (titre, statut, date de début, description)
DEMO_PROJECTS = [
    ("Cohorte sommeil et mémoire", Project.Status.ACTIVE, date(2026, 1, 12),
     "Suivi de 120 participants sur 6 mois.\nMesure de la consolidation mnésique après privation partielle de sommeil."),
    ("Attention visuelle chez l'enfant", Project.Status.ACTIVE, date(2026, 3, 2),
     "Protocole d'oculométrie en école primaire (CE1 à CM2)."),
    ("Stress et prise de décision", Project.Status.DRAFT, None,
     "Étude pilote : effet du stress aigu (test de Trier) sur l'aversion au risque."),
    ("Bilinguisme et contrôle exécutif", Project.Status.CLOSED, date(2025, 2, 17),
     "Comparaison de bilingues précoces et tardifs sur une tâche de Stroop."),
    ("Temps de réaction et vieillissement", Project.Status.ACTIVE, date(2025, 11, 4),
     "Trois groupes d'âge, tâche de temps de réaction de choix."),
    ("Méditation et régulation émotionnelle", Project.Status.DRAFT, None,
     "Programme de 8 semaines, mesures physiologiques (variabilité cardiaque)."),
    ("Lecture sur écran vs papier", Project.Status.CLOSED, date(2025, 5, 12),
     "Compréhension de textes longs selon le support de lecture."),
    ("Mémoire de travail et musique", Project.Status.ACTIVE, date(2026, 2, 23),
     "Effet d'un fond musical sur l'empan de chiffres."),
    ("Perception du rythme chez le nourrisson", Project.Status.DRAFT, date(2026, 10, 5),
     "Mesures EEG, paradigme d'oddball auditif."),
    ("Fatigue cognitive en télétravail", Project.Status.ACTIVE, date(2026, 4, 14),
     "Questionnaires en ligne et tâche de vigilance psychomotrice."),
    ("Reconnaissance des visages", Project.Status.CLOSED, date(2024, 10, 1),
     "Effet de l'inversion sur la reconnaissance de visages familiers."),
    ("Apprentissage moteur et sommeil", Project.Status.DRAFT, None,
     "Séquence de tapotement des doigts, avant et après une sieste."),
    ("Biais de confirmation en ligne", Project.Status.ACTIVE, date(2026, 5, 18),
     "Expérience en ligne : sélection d'informations sur des sujets polarisés."),
    ("Charge mentale des contrôleurs aériens", Project.Status.CLOSED, date(2025, 1, 6),
     "Simulation de trafic, mesure de la dilatation pupillaire."),
    ("Empathie et réalité virtuelle", Project.Status.DRAFT, None,
     "Prise de perspective dans un environnement immersif."),
]


class Command(BaseCommand):
    help = "Crée (ou recrée) le compte de démonstration et ses projets."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEMO_PASSWORD,
            help=f"Mot de passe du compte « {DEMO_USERNAME} » (défaut : {DEMO_PASSWORD}).",
        )

    # atomic : en cas d'erreur, rien n'est créé à moitié
    @transaction.atomic
    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(username=DEMO_USERNAME)
        user.set_password(options["password"])
        user.save()

        # Idempotent : relancer la commande remet la démo à zéro
        # sans toucher aux projets des autres utilisateurs
        user.projects.all().delete()
        Project.objects.bulk_create(
            Project(
                title=title,
                status=status,
                start_date=start_date,
                description=description,
                owner=user,
            )
            for title, status, start_date, description in DEMO_PROJECTS
        )

        action = "créé" if created else "réinitialisé"
        self.stdout.write(
            self.style.SUCCESS(
                f"Compte « {DEMO_USERNAME} » {action} avec {len(DEMO_PROJECTS)} projets "
                f"(mot de passe : {options['password']})."
            )
        )
