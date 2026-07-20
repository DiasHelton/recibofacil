from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Receipt, Signature, Notification
from ..serializers import ReceiptSerializer
from ..services import audit, finalize_receipt, receipt_html

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReceiptSerializer

    def get_queryset(self):
        return Receipt.objects.filter(
            payment__installment__loan__creditor=self.request.user
        ) | Receipt.objects.filter(
            payment__installment__loan__debtor=self.request.user
        )

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        receipt = self.get_object()
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'detail': 'Senha incorreta.'}, 400)

        Signature.objects.update_or_create(
            receipt=receipt, user=request.user
        )
        audit(request, 'Recibo assinado', receipt)

        if receipt.signatures.count() == 2 and not receipt.document_hash:
            finalize_receipt(receipt)
            loan = receipt.payment.installment.loan
            Notification.objects.bulk_create([
                Notification(
                    user=loan.creditor,
                    title='Recibo emitido',
                    message=f'Recibo {receipt.number} disponível.',
                ),
                Notification(
                    user=loan.debtor,
                    title='Recibo emitido',
                    message=f'Recibo {receipt.number} disponível.',
                ),
            ])

        return Response(ReceiptSerializer(receipt).data)

    @action(detail=True, methods=['get'])
    def document(self, request, pk=None):
        receipt = self.get_object()
        if not receipt.document_hash:
            return Response(
                {'detail': 'Aguardando as duas assinaturas.'}, 409
            )
        return HttpResponse(
            receipt_html(receipt), content_type='text/html; charset=utf-8'
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        receipt = self.get_object()
        loan = receipt.payment.installment.loan
        if loan.creditor_id != request.user.id:
            return Response(
                {'detail': 'Apenas o credor pode cancelar.'}, 403
            )
        receipt.status = 'cancelled'
        receipt.save()
        audit(request, 'Recibo cancelado', receipt)
        return Response(ReceiptSerializer(receipt).data)
