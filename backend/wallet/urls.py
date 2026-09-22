from django.urls import path

from wallet.views import (
    DemoDepositView,
    MyWalletView,
    WalletTransactionListView,
)


urlpatterns = [
    path("", MyWalletView.as_view(), name="my-wallet"),
    path(
        "demo-deposit/",
        DemoDepositView.as_view(),
        name="demo-deposit",
    ),
    path(
        "transactions/",
        WalletTransactionListView.as_view(),
        name="wallet-transactions",
    ),
]