from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Idempotently create a test user for Lean integration."

    def handle(self, *args, **options):
        username = "leantest"
        email = "leantest@example.com"
        password = "test12345"

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    f"User {username} already exists. Skipping."
                )
            )
            return

        User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Created user {username}."
            )
        )