from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Creates a default user if none exist'

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.exists():
            self.stdout.write('Users already exist, skipping')
            return
        user = User.objects.create_user(
            email='helton.dias@gmail.com',
            name='Helton',
            password='12345678',
        )
        self.stdout.write(f'Created default user: {user.email}')
