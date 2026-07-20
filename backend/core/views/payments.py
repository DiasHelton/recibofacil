from rest_framework import viewsets
from ..models import Payment
from ..serializers import PaymentSerializer

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(
            installment__loan__creditor=self.request.user
        ) | Payment.objects.filter(
            installment__loan__debtor=self.request.user
        )
