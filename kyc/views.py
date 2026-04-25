from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Count
from .models import User, KYCSubmission
from .serializers import UserSerializer, KYCSubmissionSerializer
from .state_machine import KYCStateMachine, IllegalStateTransitionError

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role', 'MERCHANT')
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password, role=role)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'user': UserSerializer(user).data})
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class KYCSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'REVIEWER':
            return KYCSubmission.objects.all().order_by('submitted_at', 'created_at')
        return KYCSubmission.objects.filter(merchant=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)

    def update(self, request, *args, **kwargs):
        # A merchant can only update if status is draft or more_info_requested
        instance = self.get_object()
        if request.user.role == 'MERCHANT' and instance.status not in ['draft', 'more_info_requested']:
            return Response({"error": "Cannot update submission in this state"}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        submission = self.get_object()
        action_name = request.data.get('action')
        notes = request.data.get('notes', '')
        
        # Auth checks
        if request.user.role == 'MERCHANT' and action_name != 'submit':
            return Response({"error": "Merchant can only perform submit action"}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'REVIEWER' and action_name not in ['review', 'approve', 'reject', 'request_info']:
            return Response({"error": "Invalid reviewer action"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            KYCStateMachine.transition(submission, action_name, reviewer=request.user, notes=notes)
            return Response(KYCSubmissionSerializer(submission).data)
        except IllegalStateTransitionError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReviewerStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'REVIEWER':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        now = timezone.now()
        queue_count = KYCSubmission.objects.filter(status__in=['submitted', 'under_review']).count()
        
        in_queue = KYCSubmission.objects.filter(status__in=['submitted', 'under_review'], submitted_at__isnull=False)
        total_time = sum((now - s.submitted_at).total_seconds() for s in in_queue)
        avg_time = (total_time / queue_count) if queue_count > 0 else 0
        
        seven_days_ago = now - timedelta(days=7)
        decisions_7d = KYCSubmission.objects.filter(status__in=['approved', 'rejected'], updated_at__gte=seven_days_ago)
        total_decisions = decisions_7d.count()
        appr_decisions = decisions_7d.filter(status='approved').count()
        appr_rate = (appr_decisions / total_decisions * 100) if total_decisions > 0 else 0
        
        return Response({
            "queue_size": queue_count,
            "avg_time_in_queue_seconds": avg_time,
            "approval_rate_7d": appr_rate
        })
