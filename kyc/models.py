from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('MERCHANT', 'Merchant'),
        ('REVIEWER', 'Reviewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MERCHANT')

class KYCSubmission(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    )

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kyc_submissions')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    
    # Personal Details
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Business Details
    business_name = models.CharField(max_length=200, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    expected_volume_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Documents
    pan_document = models.FileField(upload_to='kyc_docs/pan/', null=True, blank=True)
    aadhaar_document = models.FileField(upload_to='kyc_docs/aadhaar/', null=True, blank=True)
    bank_statement = models.FileField(upload_to='kyc_docs/bank/', null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    reviewer_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.merchant.username} - {self.status}"

class NotificationEvent(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event_type = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} for {self.merchant.username}"
