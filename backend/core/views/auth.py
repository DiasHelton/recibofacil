from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from ..models import User
from ..serializers import RegisterSerializer, UserSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed('Nenhum usuário encontrado com este e-mail.')
        if not user.check_password(password):
            raise AuthenticationFailed('E-mail ou senha inválidos.')
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    data = request.data
    user = request.user
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'photo' in request.FILES:
        user.photo = request.FILES['photo']
    user.save(update_fields=['name', 'phone', 'photo'])
    return Response(UserSerializer(user).data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = User.objects.create_user(
        username=s.validated_data['email'],
        email=s.validated_data['email'],
        password=s.validated_data['password'],
        name=s.validated_data['name'],
        phone=s.validated_data.get('phone', ''),
    )
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
    }, status=201)
