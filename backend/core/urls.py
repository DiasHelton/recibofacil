from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoanViewSet, PaymentViewSet, ReceiptViewSet,
    UserViewSet, NotificationViewSet,
    dashboard, register, me,
)
from .views.auth import EmailTokenObtainPairView

router = DefaultRouter()
router.register('loans', LoanViewSet, basename='loan')
router.register('payments', PaymentViewSet, basename='payment')
router.register('receipts', ReceiptViewSet, basename='receipt')
router.register('users', UserViewSet, basename='user')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/token/', EmailTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/register/', register),
    path('auth/me/', me),
    path('dashboard/', dashboard),
] + router.urls
