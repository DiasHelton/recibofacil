import uuid
from django.conf import settings
from django.db import models

class Receipt(models.Model):
    class Status(models.TextChoices):
        VALID = 'valid', 'Válido'
        CANCELLED = 'cancelled', 'Cancelado'

    payment = models.OneToOneField(
        'Payment', on_delete=models.PROTECT, related_name='receipt'
    )
    number = models.CharField(max_length=36, unique=True, default=uuid.uuid4)
    document_hash = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.VALID)
    created_at = models.DateTimeField(auto_now_add=True)


class Signature(models.Model):
    receipt = models.ForeignKey(
        Receipt, on_delete=models.PROTECT, related_name='signatures'
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('receipt', 'user')]
