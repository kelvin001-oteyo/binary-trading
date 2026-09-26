from decimal import Decimal, InvalidOperation
from rest_framework.pagination import PageNumberPagination

from wallet.serializers import WalletTransactionSerializer
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wallet.models import Wallet, WalletTransaction


import json

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from wallet.lean_service import (
    create_customer,
    create_payment_intent,
    verify_webhook_signature,
)


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


class LeanCreateCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        wallet, _ = Wallet.objects.get_or_create(
            user=request.user
        )

        if wallet.lean_customer_id:
            return Response(
                {"customer_id": wallet.lean_customer_id},
                status=status.HTTP_200_OK,
            )

        customer_id, error = create_customer(request.user.id)

        if error:
            return Response(
                {"detail": f"Lean error: {error}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        wallet.lean_customer_id = customer_id
        wallet.save(update_fields=["lean_customer_id", "updated_at"])

        return Response(
            {"customer_id": customer_id},
            status=status.HTTP_200_OK,
        )


class LeanCreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")

        if amount is None:
            return Response(
                {"detail": "amount is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response(
                {"detail": "amount must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {"detail": "amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet, _ = Wallet.objects.get_or_create(
            user=request.user
        )

        if not wallet.lean_customer_id:
            return Response(
                {
                    "detail": (
                        "No Lean customer linked. "
                        "Call create-customer first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        destination_id = os.environ.get(
            "LEAN_PAYMENT_DESTINATION_ID", ""
        )

        if not destination_id:
            return Response(
                {
                    "detail": (
                        "LEAN_PAYMENT_DESTINATION_ID "
                        "not configured on the server."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        intent_id, error = create_payment_intent(
            wallet.lean_customer_id,
            amount,
            destination_id,
        )

        if error:
            return Response(
                {"detail": f"Lean error: {error}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"payment_intent_id": intent_id},
            status=status.HTTP_200_OK,
        )

@method_decorator(csrf_exempt, name="dispatch")
class LeanWebhookView(APIView):
    permission_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("lean-signature", "")

        if not verify_webhook_signature(raw_body, signature):
            return Response(
                {"detail": "Invalid signature."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = payload.get("type")

        # Only act on completed payments for now
        if event_type not in (
            "payment.created",
            "payment.updated",
        ):
            return Response({"received": True})

        # Webhook payload shape varies — log for now
        print(f"[LEAN WEBHOOK] {event_type}")
        print(json.dumps(payload, indent=2))

        return Response({"received": True})