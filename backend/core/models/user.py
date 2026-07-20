from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    name = models.CharField('nome ou apelido', max_length=160)

    @property
    def full_name(self):
        return self.name or super().get_full_name() or self.username
