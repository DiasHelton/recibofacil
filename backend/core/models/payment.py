from django.conf import settings
from django.db import models

class Payment(models.Model):
    class Method(models.TextChoices):
        PIX = 'pix', 'PIX'
        CASH = 'cash', 'Dinheiro'
        TED = 'ted', 'TED'
        DOC = 'doc', 'DOC'
        CARD = 'card', 'Cartão'
        OTHER = 'other', 'Outro'

    installment = models.OneToOneField(
        'Installment', on_delete=models.PROTECT, related_name='payment'
    )
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=Method.choices)
    notes = models.TextField(blank=True)
    proof = models.FileField(upload_to='proofs/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    confirmed = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
