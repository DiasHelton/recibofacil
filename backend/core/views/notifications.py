from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import Notification
from ..serializers import NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.read_at = timezone.now()
        notification.save(update_fields=['read_at'])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        self.get_queryset().filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({'detail': 'Todas as notificações marcadas como lidas.'})
