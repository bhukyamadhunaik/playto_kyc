from rest_framework.exceptions import ValidationError

ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def validate_kyc_document(file):
    if not file:
        return
        
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(f"File size exceeds 5MB limit. Got: {file.size / (1024*1024):.2f}MB")
        
    file_name = file.name.lower()
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if not any(file_name.endswith(ext) for ext in valid_extensions):
        raise ValidationError("Invalid file type. Acceptable types are PDF, JPG, PNG.")
        
    content_type = getattr(file, 'content_type', None)
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"Invalid file content type: {content_type}.")
