from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, KYCSubmissionViewSet, ReviewerStatsView

router = DefaultRouter()
router.register(r'submissions', KYCSubmissionViewSet, basename='kycsubmission')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('reviewer/stats/', ReviewerStatsView.as_view(), name='reviewer-stats'),
    path('', include(router.urls)),
]
