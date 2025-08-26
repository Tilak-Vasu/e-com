from rest_framework import permissions

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a review or admins to edit/delete it.
    Everyone else can only read.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions (GET, HEAD, OPTIONS) are allowed for any request,
        # so we'll always allow these.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions (PUT, PATCH, DELETE) are only allowed to the author
        # of the review or any user who is staff/admin.
        # 'obj' here is the ProductReview instance.
        return obj.author == request.user or request.user.is_staff