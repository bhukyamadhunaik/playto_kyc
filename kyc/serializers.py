from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import KYCSubmission, NotificationEvent
from .validators import validate_kyc_document

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'role', 'email')

class KYCSubmissionSerializer(serializers.ModelSerializer):
    pan_document = serializers.FileField(validators=[validate_kyc_document], required=False)
    aadhaar_document = serializers.FileField(validators=[validate_kyc_document], required=False)
    bank_statement = serializers.FileField(validators=[validate_kyc_document], required=False)
    
    is_at_risk = serializers.SerializerMethodField()
    merchant_info = UserSerializer(source='merchant', read_only=True)

    class Meta:
        model = KYCSubmission
        fields = '__all__'
        read_only_fields = ('merchant', 'status', 'created_at', 'updated_at', 'submitted_at', 'reviewer_notes')

    def get_is_at_risk(self, obj):
        if obj.status in ['submitted', 'under_review'] and obj.submitted_at:
            return (timezone.now() - obj.submitted_at) > timedelta(hours=24)
        return False
