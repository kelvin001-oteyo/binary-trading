from decimal import Decimal

from django.conf import settings
from django.db import models


class Trade(models.Model):
    class TradeType(models.TextChoices):
        RISE = "RISE", "Rise"
        FALL = "FALL", "Fall"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        WON = "WON", "Won"
        LOST = "LOST", "Lost"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trades",
    )

    market = models.CharField(
        max_length=50,
        default="DEMO/USD",
    )

    trade_type = models.CharField(
        max_length=10,
        choices=TradeType.choices,
    )

    stake = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    entry_price = models.DecimalField(
        max_digits=20,
        decimal_places=8,
    )

    exit_price = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        null=True,
        blank=True,
    )

    duration_seconds = models.PositiveIntegerField(
        default=60,
    )

    result = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    profit_loss = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    expires_at = models.DateTimeField()

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.market} - "
            f"{self.trade_type} - "
            f"{self.result}"
        )