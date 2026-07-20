from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny

from ..models import User
from ..serializers import UserSerializer


class UserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    search_fields = ['name', 'email']
