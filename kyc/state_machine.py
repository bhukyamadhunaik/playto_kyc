from django.utils import timezone
from .models import KYCSubmission, NotificationEvent

class IllegalStateTransitionError(Exception):
    pass

class KYCStateMachine:
    TRANSITIONS = {
        'draft': {
            'submit': 'submitted'
        },
        'submitted': {
            'review': 'under_review'
        },
        'under_review': {
            'approve': 'approved',
            'reject': 'rejected',
            'request_info': 'more_info_requested'
        },
        'more_info_requested': {
            'submit': 'submitted'
        }
    }

    @staticmethod
    def transition(submission: KYCSubmission, action: str, reviewer=None, notes: str = "") -> KYCSubmission:
        current_state = submission.status
        allowed_actions = KYCStateMachine.TRANSITIONS.get(current_state, {})
        
        if action not in allowed_actions:
            raise IllegalStateTransitionError(
                f"Cannot perform action '{action}' from state '{current_state}'."
            )
            
        new_state = allowed_actions[action]
        submission.status = new_state
        
        if new_state == 'submitted':
            submission.submitted_at = timezone.now()
            
        if notes:
            submission.reviewer_notes = notes
            
        submission.save()
        
        payload = {
            'action': action,
            'from_state': current_state,
            'to_state': new_state,
            'notes': notes
        }
        if reviewer:
            payload['reviewer_id'] = reviewer.id
            
        NotificationEvent.objects.create(
            merchant=submission.merchant,
            event_type=f"state_transition_to_{new_state}",
            payload=payload
        )
        
        return submission
