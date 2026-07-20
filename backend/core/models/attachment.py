from django.db import models

class Attachment(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.PROTECT, related_name='attachments')
    file = models.FileField(upload_to='attachments/')
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
