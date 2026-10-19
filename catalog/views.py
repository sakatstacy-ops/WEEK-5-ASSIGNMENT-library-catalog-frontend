from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from rest_framework import permissions, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView


BOOKS = [
    {
        "id": "matilda",
        "title": "Matilda",
        "author": "Roald Dahl",
        "isbn": "9780140328721",
        "description": "A brilliant reader discovers that her mind is her greatest superpower.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780140328721-L.jpg",
        "category": "Children's fiction",
    },
    {
        "id": "gatsby",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "description": "A glittering summer on Long Island hides a story of longing and reinvention.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
        "category": "Classic fiction",
    },
    {
        "id": "mockingbird",
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780061120084",
        "description": "A young girl's view of justice, courage, and community in Alabama.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
        "category": "Literary fiction",
    },
    {
        "id": "hobbit",
        "title": "The Hobbit",
        "author": "J. R. R. Tolkien",
        "isbn": "9780544003415",
        "description": "An unexpected journey takes a home-loving hobbit beyond the familiar.",
        "cover_image": "https://covers.openlibrary.org/b/isbn/9780544003415-L.jpg",
        "category": "Fantasy",
    },
]


def user_payload(user):
    return {
        "id": user.pk,
        "email": user.email,
        "name": user.first_name or user.username,
    }


class BookListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(BOOKS)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        name = str(request.data.get("name", "")).strip()
        password = str(request.data.get("password", ""))

        errors = {}
        if not email:
            errors["email"] = ["Enter your email address."]
        else:
            try:
                validate_email(email)
            except DjangoValidationError:
                errors["email"] = ["Enter a valid email address."]
            if len(email) > 150:
                errors["email"] = ["Email address must be 150 characters or fewer."]
            if get_user_model().objects.filter(email__iexact=email).exists():
                errors["email"] = ["An account with this email already exists."]

        if len(name) > 150:
            errors["name"] = ["Name must be 150 characters or fewer."]
        if not password:
            errors["password"] = ["Enter a password."]
        else:
            try:
                validate_password(password)
            except DjangoValidationError as error:
                errors["password"] = list(error.messages)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = get_user_model().objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
        )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": user_payload(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = str(request.data.get("password", ""))
        user_record = get_user_model().objects.filter(email__iexact=email).first()
        user = None
        if user_record and password:
            user = authenticate(
                request,
                username=user_record.username,
                password=password,
            )

        if user is None:
            return Response(
                {"detail": "Email or password is incorrect."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_payload(user)})


class CurrentUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": user_payload(request.user)})