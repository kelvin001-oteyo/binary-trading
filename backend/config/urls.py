from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("django-admin/", admin.site.urls),

    path(
        "api/v1/accounts/",
        include("accounts.urls"),
    ),

    path(
        "api/v1/wallet/",
        include("wallet.urls"),
    ),

    path(
        "api/v1/trading/",
        include("trading.urls"),
    ),

    path(
        "api/v1/ai/",
        include("ai_assistant.urls"),
    ),

    path(
        "api/v1/admin/",
        include("accounts.admin_urls"),
    ),
]