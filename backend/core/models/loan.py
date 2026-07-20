from django.conf import settings
from django.db import models

class Loan(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Ativo'
        PAID = 'paid', 'Quitado'
        CANCELLED = 'cancelled', 'Cancelado'

    name = models.CharField(max_length=180)
    creditor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='loans_lent'
    )
    debtor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='loans_borrowed'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    installments = models.PositiveIntegerField()
    installment_value = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    loan_date = models.DateField()
    first_due_date = models.DateField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)


class Installment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        PAID = 'paid', 'Pago'
        OVERDUE = 'overdue', 'Atrasado'

    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name='installment_list')
    number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        unique_together = [('loan', 'number')]
        ordering = ['number']
