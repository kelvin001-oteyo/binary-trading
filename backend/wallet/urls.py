from django.urls import path

from wallet.views import (
    DemoDepositView,
    LeanCreateCustomerView,
    LeanCreatePaymentView,
    LeanWebhookView,
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
    path(
        "lean/create-customer/",
        LeanCreateCustomerView.as_view(),
        name="lean-create-customer",
    ),
    path(
        "lean/create-payment/",
        LeanCreatePaymentView.as_view(),
        name="lean-create-payment",
    ),
    path(
        "lean/webhook/",
        LeanWebhookView.as_view(),
        name="lean-webhook",
    ),
]