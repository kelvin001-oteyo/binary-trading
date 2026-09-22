from decimal import Decimal

from rest_framework import serializers

from trading.models import Trade


class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = [
            "id",
            "market",
            "trade_type",
            "stake",
            "entry_price",
            "exit_price",
            "duration_seconds",
            "result",
            "profit_loss",
            "created_at",
            "expires_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "exit_price",
            "result",
            "profit_loss",
            "created_at",
            "expires_at",
            "updated_at",
        ]


class CreateTradeSerializer(serializers.Serializer):
    market = serializers.CharField(
        max_length=50,
        default="DEMO/USD",
    )

    trade_type = serializers.ChoiceField(
        choices=Trade.TradeType.choices,
    )

    stake = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    entry_price = serializers.DecimalField(
        max_digits=20,
        decimal_places=8,
        min_value=Decimal("0.00000001"),
    )

    duration_seconds = serializers.IntegerField(
        min_value=10,
        max_value=3600,
        default=60,
    )