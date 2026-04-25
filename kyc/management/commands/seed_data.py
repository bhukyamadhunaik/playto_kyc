from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from kyc.models import KYCSubmission

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial data with 2 merchants and 1 reviewer'

    def handle(self, *args, **kwargs):
        # Clear existing data
        User.objects.all().delete()

        # Create Reviewer
        reviewer = User.objects.create_superuser(username='reviewer', password='password123', role='REVIEWER', email='reviewer@playto.com')

        # Create Merchant 1 (Draft)
        merchant_draft = User.objects.create_user(username='merchant_draft', password='password123', role='MERCHANT', email='draft@playto.com')
        KYCSubmission.objects.create(
            merchant=merchant_draft,
            status='draft',
            first_name='Draft',
            last_name='Merchant',
            business_name='Draft LLC'
        )

        # Create Merchant 2 (Under Review)
        from django.utils import timezone
        merchant_review = User.objects.create_user(username='merchant_review', password='password123', role='MERCHANT', email='review@playto.com')
        KYCSubmission.objects.create(
            merchant=merchant_review,
            status='under_review',
            first_name='Review',
            last_name='Merchant',
            business_name='Review Corp',
            submitted_at=timezone.now() - timezone.timedelta(hours=25)  # To trigger SLA alert
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded 2 merchants (1 draft, 1 reviewing over 24h) and 1 reviewer."))
