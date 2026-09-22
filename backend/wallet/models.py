from decimal import Decimal

from django.conf import settings
from django.db import models


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("10000.00"),
    )
    currency = models.CharField(max_length=10, default="USD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.balance} {self.currency}"


class WalletTransaction(models.Model):
    class TransactionType(models.TextChoices):
        DEMO_DEPOSIT = "DEMO_DEPOSIT", "Demo Deposit"
        TRADE_STAKE = "TRADE_STAKE", "Trade Stake"
        TRADE_RETURN = "TRADE_RETURN", "Trade Return"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet_transactions",
    )
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=30,
        choices=TransactionType.choices,
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    balance_before = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    balance_after = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    description = models.CharField(
        max_length=255,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount}"