from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView

from catalog.views import BookListView, CurrentUserView, LoginView, RegisterView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/books/", BookListView.as_view(), name="book-list"),
    path("api/auth/login", LoginView.as_view(), name="login"),
    path("api/auth/login/", LoginView.as_view(), name="login-slash"),
    path("api/auth/register", RegisterView.as_view(), name="register"),
    path("api/auth/register/", RegisterView.as_view(), name="register-slash"),
    path("api/auth/me", CurrentUserView.as_view(), name="current-user"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current-user-slash"),
    re_path(r"^(?P<frontend_path>.*)$", TemplateView.as_view(template_name="index.html"), name="frontend"),
]