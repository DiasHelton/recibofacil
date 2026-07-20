from .auth import register, me
from .dashboard import dashboard
from .loans import LoanViewSet
from .payments import PaymentViewSet
from .receipts import ReceiptViewSet
from .users import UserViewSet
from .notifications import NotificationViewSet

__all__ = [
    'register', 'me', 'dashboard',
    'LoanViewSet', 'PaymentViewSet', 'ReceiptViewSet',
    'UserViewSet', 'NotificationViewSet',
]
