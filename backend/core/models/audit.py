from django.conf import settings
from django.db import models

class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True
    )
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=50)
    ip = models.GenericIPAddressField(null=True)
    device = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
