from django.urls import path

from trading.views import (
    CreateTradeView,
    SettleTradeView,
    TradeDetailView,
    TradeListView,
)


urlpatterns = [
    path(
        "",
        TradeListView.as_view(),
        name="trade-list",
    ),
    path(
        "create/",
        CreateTradeView.as_view(),
        name="trade-create",
    ),
    path(
        "<int:pk>/",
        TradeDetailView.as_view(),
        name="trade-detail",
    ),
    path(
        "<int:pk>/settle/",
        SettleTradeView.as_view(),
        name="trade-settle",
    ),
]