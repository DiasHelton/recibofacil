from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from ..models import Loan, Installment, Payment, Receipt, Signature, Notification
from ..serializers import LoanSerializer, PaymentSerializer, ReceiptSerializer
from ..services import audit, finalize_receipt

class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer

    def get_queryset(self):
        return Loan.objects.filter(
            creditor=self.request.user
        ) | Loan.objects.filter(
            debtor=self.request.user
        )

    def perform_create(self, serializer):
        with transaction.atomic():
            loan = serializer.save(creditor=self.request.user)
            for n in range(loan.installments):
                Installment.objects.create(
                    loan=loan,
                    number=n + 1,
                    due_date=loan.first_due_date + relativedelta(months=n),
                    amount=loan.installment_value,
                )
            audit(self.request, 'Empréstimo criado', loan)

    def perform_update(self, serializer):
        if self.get_object().creditor_id != self.request.user.id:
            raise PermissionDenied('Apenas o credor pode editar o empréstimo.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.creditor_id != self.request.user.id:
            raise PermissionDenied('Apenas o credor pode excluir o empréstimo.')
        instance.delete()

    def _verify_password(self, request):
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'detail': 'Senha incorreta.'}, 403)
        return None

    @action(detail=True, methods=['post'], url_path='installments/(?P<number>[^/.]+)/pay')
    def pay(self, request, pk=None, number=None):
        loan = self.get_object()
        if loan.creditor_id != request.user.id and loan.debtor_id != request.user.id:
            return Response({'detail': 'Você não participa deste empréstimo.'}, 403)

        err = self._verify_password(request)
        if err:
            return err

        installment = loan.installment_list.get(number=number)
        if installment.status == 'paid':
            return Response({'detail': 'Parcela já paga.'}, 400)

        is_creditor = loan.creditor_id == request.user.id

        s = PaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        payment = s.save(
            installment=installment,
            recorded_by=request.user,
            confirmed=is_creditor,
        )
        if is_creditor:
            payment.confirmed_at = timezone.now()
            payment.save(update_fields=['confirmed_at'])

        installment.status = 'paid'
        installment.save()

        receipt = Receipt.objects.create(payment=payment)
        Signature.objects.create(receipt=receipt, user=request.user)

        finalized = False
        if is_creditor:
            audit_action = 'Pagamento registrado'
            if receipt.signatures.count() == 2:
                finalize_receipt(receipt)
                finalized = True
        else:
            audit_action = 'Pagamento registrado (aguardando confirmação)'

        audit(request, audit_action, payment)

        Notification.objects.bulk_create([
            Notification(
                user=loan.creditor,
                title='Pagamento registrado',
                message=f'Parcela {number} paga por {"credor" if is_creditor else "devedor"}'
                        f'{"." if is_creditor else " — aguardando confirmação."}',
            ),
            Notification(
                user=loan.debtor,
                title='Pagamento registrado',
                message=f'Parcela {number} paga por {"credor" if is_creditor else "devedor"}'
                        f'{"." if is_creditor else " — aguardando confirmação."}',
            ),
        ])
        if finalized:
            Notification.objects.bulk_create([
                Notification(user=loan.creditor, title='Recibo emitido', message=f'Recibo da parcela {number} disponível.'),
                Notification(user=loan.debtor, title='Recibo emitido', message=f'Recibo da parcela {number} disponível.'),
            ])

        return Response({
            'payment': PaymentSerializer(payment).data,
            'receipt': ReceiptSerializer(receipt).data,
        }, 201)

    @action(detail=True, methods=['post'], url_path='installments/(?P<number>[^/.]+)/confirm')
    def confirm_payment(self, request, pk=None, number=None):
        loan = self.get_object()
        if loan.creditor_id != request.user.id:
            return Response({'detail': 'Apenas o credor pode confirmar.'}, 403)

        err = self._verify_password(request)
        if err:
            return err

        installment = loan.installment_list.get(number=number)
        if installment.status != 'paid':
            return Response({'detail': 'Parcela ainda não foi paga.'}, 400)

        try:
            payment = installment.payment
        except Payment.DoesNotExist:
            return Response({'detail': 'Nenhum pagamento encontrado.'}, 400)

        if payment.confirmed:
            return Response({'detail': 'Pagamento já confirmado.'}, 400)

        payment.confirmed = True
        payment.confirmed_at = timezone.now()
        payment.save(update_fields=['confirmed', 'confirmed_at'])

        receipt = payment.receipt
        Signature.objects.create(receipt=receipt, user=request.user)

        if receipt.signatures.count() == 2:
            finalize_receipt(receipt)

        audit(request, 'Pagamento confirmado', payment)

        Notification.objects.bulk_create([
            Notification(
                user=loan.creditor,
                title='Pagamento confirmado',
                message=f'Parcela {number} confirmada. Recibo disponível.',
            ),
            Notification(
                user=loan.debtor,
                title='Pagamento confirmado',
                message=f'Parcela {number} confirmada. Recibo disponível.',
            ),
        ])

        return Response({
            'payment': PaymentSerializer(payment).data,
            'receipt': ReceiptSerializer(receipt).data,
        })
