from rest_framework import serializers

from wallet.models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = [
            "id",
            "balance",
            "currency",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class WalletTransactionSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(
        source="get_transaction_type_display",
        read_only=True,
    )
    signed_amount = serializers.SerializerMethodField()

    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "transaction_type",
            "type_label",
            "amount",
            "signed_amount",
            "balance_before",
            "balance_after",
            "description",
            "created_at",
        ]
        read_only_fields = fields

    def get_signed_amount(self, obj):
        from decimal import Decimal

        debit_types = {
            WalletTransaction.TransactionType.TRADE_STAKE,
        }

        amount = Decimal(obj.amount)

        if obj.transaction_type in debit_types:
            return -amount

        return amount