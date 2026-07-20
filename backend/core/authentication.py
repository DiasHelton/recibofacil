from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

class QueryParamTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.query_params.get('token')
        if not token:
            return None
        try:
            access_token = AccessToken(token)
            user = get_user_model().objects.get(id=access_token['user_id'])
            return (user, access_token)
        except Exception:
            raise AuthenticationFailed('Token inválido ou expirado.')
