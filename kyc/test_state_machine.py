import pytest
from django.contrib.auth import get_user_model
from kyc.models import KYCSubmission
from kyc.state_machine import KYCStateMachine, IllegalStateTransitionError

User = get_user_model()

@pytest.mark.django_db
def test_illegal_state_transition():
    # Setup
    merchant = User.objects.create_user(username='test_merchant', password='password123', role='MERCHANT')
    submission = KYCSubmission.objects.create(merchant=merchant, status='draft')
    
    # Try to approve a draft (illegal transition)
    with pytest.raises(IllegalStateTransitionError):
        KYCStateMachine.transition(submission, 'approve')
        
    # The status should still be draft
    submission.refresh_from_db()
    assert submission.status == 'draft'

    # Legal transition
    KYCStateMachine.transition(submission, 'submit')
    submission.refresh_from_db()
    assert submission.status == 'submitted'
