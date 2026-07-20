from datetime import date
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Loan, Installment, Payment
from ..serializers import InstallmentSerializer


def _compute_stats(loans):
    installments = Installment.objects.filter(loan__in=loans)
    total = loans.aggregate(v=Sum('amount'))['v'] or 0
    received = Payment.objects.filter(
        installment__loan__in=loans
    ).aggregate(v=Sum('amount'))['v'] or 0
    pending = installments.filter(status='pending').count()
    paid = installments.filter(status='paid').count()
    upcoming = installments.filter(
        status='pending'
    ).order_by('due_date').first()
    return {
        'total': total,
        'received': received,
        'remaining': total - received,
        'installments': installments.count(),
        'paid': paid,
        'pending': pending,
        'next_due': InstallmentSerializer(upcoming).data if upcoming else None,
    }


@api_view(['GET'])
def dashboard(request):
    lent = Loan.objects.filter(creditor=request.user)
    borrowed = Loan.objects.filter(debtor=request.user)
    return Response({
        'as_creditor': _compute_stats(lent),
        'as_debtor': _compute_stats(borrowed),
    })
