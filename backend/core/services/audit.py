from ..models import AuditLog

def audit(request, action, obj):
    AuditLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        entity=obj.__class__.__name__,
        entity_id=str(obj.pk),
        ip=request.META.get('REMOTE_ADDR'),
        device=request.META.get('HTTP_USER_AGENT', '')[:255],
    )
