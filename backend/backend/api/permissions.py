from rest_framework import permissions

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a review, staff, or superusers (admins) 
    to edit/delete it. Everyone else can only read.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions (GET, HEAD, OPTIONS) are allowed for any request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # --- THIS IS THE FIX ---
        # Write permissions (PUT, PATCH, DELETE) are allowed if the user is the author,
        # a staff member, OR a superuser (admin).
        # 'obj' here is the ProductReview instance.
        return obj.author == request.user or request.user.is_staff or request.user.is_superuser