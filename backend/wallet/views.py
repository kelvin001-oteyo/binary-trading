from decimal import Decimal, InvalidOperation
from rest_framework.pagination import PageNumberPagination

from wallet.serializers import WalletTransactionSerializer
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wallet.models import Wallet, WalletTransaction


class MyWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(
            user=request.user
        )

        return Response({
            "id": wallet.id,
            "balance": wallet.balance,
            "currency": wallet.currency,
            "created_at": wallet.created_at,
            "updated_at": wallet.updated_at,
        })


class DemoDepositView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        amount = request.data.get("amount")

        if amount is None:
            return Response(
                {"detail": "Deposit amount is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, ValueError, TypeError):
            return Response(
                {"detail": "Deposit amount must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {"detail": "Deposit amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > Decimal("1000000.00"):
            return Response(
                {"detail": "Maximum demo deposit is $1,000,000."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet = Wallet.objects.select_for_update().get(
            user=request.user
        )

        balance_before = wallet.balance
        wallet.balance += amount
        wallet.save(update_fields=["balance", "updated_at"])

        WalletTransaction.objects.create(
            user=request.user,
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.DEMO_DEPOSIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description="Demo funds added to virtual wallet.",
        )

        return Response(
            {
                "detail": "Demo funds added successfully.",
                "amount": amount,
                "balance_before": balance_before,
                "balance_after": wallet.balance,
                "currency": wallet.currency,
                "demo": True,
            },
            status=status.HTTP_200_OK,
        )

class WalletTransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class WalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = WalletTransaction.objects.filter(
            user=request.user
        ).order_by("-created_at")

        transaction_type = request.query_params.get("type")

        if transaction_type:
            queryset = queryset.filter(
                transaction_type=transaction_type
            )

        paginator = WalletTransactionPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = WalletTransactionSerializer(
            page, many=True
        )

        return paginator.get_paginated_response(
            serializer.data
        )