from decimal import Decimal, InvalidOperation

from django.db.models import Avg, Count, Sum

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from ai_assistant.models import AIConfiguration
from ai_assistant.services import get_ai_configuration
from trading.models import Trade
from wallet.models import Wallet
def is_admin(request):
    return (
        request.user.is_authenticated
        and request.user.role == User.Role.ADMIN
    )


def admin_required(request):
    if not is_admin(request):
        return Response(
            {"detail": "Admin access required."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        total_users = User.objects.count()

        active_users = User.objects.filter(
            is_active=True
        ).count()

        total_trades = Trade.objects.count()

        pending_trades = Trade.objects.filter(
            result=Trade.Status.PENDING
        ).count()

        won_trades = Trade.objects.filter(
            result=Trade.Status.WON
        ).count()

        lost_trades = Trade.objects.filter(
            result=Trade.Status.LOST
        ).count()

        total_demo_balance = (
            Wallet.objects.aggregate(
                total=Sum("balance")
            )["total"]
            or Decimal("0.00")
        )

        total_profit_loss = (
            Trade.objects.aggregate(
                total=Sum("profit_loss")
            )["total"]
            or Decimal("0.00")
        )

        return Response(
            {
                "total_users": total_users,
                "active_users": active_users,
                "total_trades": total_trades,
                "pending_trades": pending_trades,
                "won_trades": won_trades,
                "lost_trades": lost_trades,
                "total_demo_balance": total_demo_balance,
                "total_profit_loss": total_profit_loss,
            }
        )


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        users = User.objects.all().order_by("-date_joined")

        data = []

        for user in users:
            try:
                balance = user.wallet.balance
                currency = user.wallet.currency
            except Wallet.DoesNotExist:
                balance = Decimal("0.00")
                currency = "USD"

            data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "role": user.role,
                    "is_active": user.is_active,
                    "date_joined": user.date_joined,
                    "balance": balance,
                    "currency": currency,
                }
            )

        return Response(data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        denied = admin_required(request)

        if denied:
            return denied

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            wallet = user.wallet
        except Wallet.DoesNotExist:
            wallet = None

        trades = Trade.objects.filter(
            user=user
        )

        total_trades = trades.count()

        won_trades = trades.filter(
            result=Trade.Status.WON
        ).count()

        lost_trades = trades.filter(
            result=Trade.Status.LOST
        ).count()

        total_profit_loss = (
            trades.aggregate(
                total=Sum("profit_loss")
            )["total"]
            or Decimal("0.00")
        )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "role": user.role,
                "is_active": user.is_active,
                "date_joined": user.date_joined,
                "wallet": {
                    "balance": (
                        wallet.balance
                        if wallet
                        else Decimal("0.00")
                    ),
                    "currency": (
                        wallet.currency
                        if wallet
                        else "USD"
                    ),
                },
                "trading": {
                    "total_trades": total_trades,
                    "won_trades": won_trades,
                    "lost_trades": lost_trades,
                    "total_profit_loss": total_profit_loss,
                },
            }
        )


class AdminUserStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        denied = admin_required(request)

        if denied:
            return denied

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.id == request.user.id:
            return Response(
                {
                    "detail": (
                        "You cannot deactivate your own "
                        "admin account."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = not user.is_active
        user.save(
            update_fields=["is_active"]
        )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "is_active": user.is_active,
                "detail": (
                    "User activated."
                    if user.is_active
                    else "User deactivated."
                ),
            }
        )


class AdminWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        denied = admin_required(request)

        if denied:
            return denied

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        balance = request.data.get("balance")

        if balance is None:
            return Response(
                {"detail": "Balance is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            balance = Decimal(str(balance))
        except (InvalidOperation, ValueError, TypeError):
            return Response(
                {"detail": "Balance must be numeric."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if balance < 0:
            return Response(
                {
                    "detail": (
                        "Balance cannot be negative."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet, created = Wallet.objects.get_or_create(
            user=user,
            defaults={
                "balance": balance,
                "currency": "USD",
            },
        )

        if not created:
            wallet.balance = balance
            wallet.save(
                update_fields=[
                    "balance",
                    "updated_at",
                ]
            )

        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "balance": wallet.balance,
                "currency": wallet.currency,
                "detail": (
                    "Demo wallet balance updated."
                ),
            }
        )


class AdminTradesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        trades = (
            Trade.objects
            .select_related("user")
            .order_by("-created_at")
        )

        data = []

        for trade in trades:
            data.append(
                {
                    "id": trade.id,
                    "username": trade.user.username,
                    "market": trade.market,
                    "trade_type": trade.trade_type,
                    "stake": trade.stake,
                    "entry_price": trade.entry_price,
                    "exit_price": trade.exit_price,
                    "duration_seconds": (
                        trade.duration_seconds
                    ),
                    "result": trade.result,
                    "profit_loss": trade.profit_loss,
                    "created_at": trade.created_at,
                    "expires_at": trade.expires_at,
                }
            )

        return Response(data)



class AdminAIConfigurationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        configuration = get_ai_configuration()

        return Response({
            "id": configuration.id,
            "enabled": configuration.enabled,
            "analysis_enabled": configuration.analysis_enabled,
            "suggestions_enabled": configuration.suggestions_enabled,
            "risk_level": configuration.risk_level,
            "confidence_threshold": configuration.confidence_threshold,
            "status_message": configuration.status_message,
            "updated_at": configuration.updated_at,
        })

    def patch(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        configuration = get_ai_configuration()

        allowed_fields = [
            "enabled",
            "analysis_enabled",
            "suggestions_enabled",
            "risk_level",
            "confidence_threshold",
            "status_message",
        ]

        for field in allowed_fields:
            if field not in request.data:
                continue

            value = request.data[field]

            if field in [
                "enabled",
                "analysis_enabled",
                "suggestions_enabled",
            ]:
                if not isinstance(value, bool):
                    return Response(
                        {
                            "detail": (
                                f"{field} must be true or false."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif field == "risk_level":
                if value not in [
                    AIConfiguration.RiskLevel.LOW,
                    AIConfiguration.RiskLevel.MEDIUM,
                    AIConfiguration.RiskLevel.HIGH,
                ]:
                    return Response(
                        {
                            "detail": (
                                "Invalid risk level."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif field == "confidence_threshold":
                try:
                    value = Decimal(str(value))
                except (
                    InvalidOperation,
                    ValueError,
                    TypeError,
                ):
                    return Response(
                        {
                            "detail": (
                                "Confidence threshold "
                                "must be numeric."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if value < 0 or value > 100:
                    return Response(
                        {
                            "detail": (
                                "Confidence threshold "
                                "must be between 0 and 100."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            elif field == "status_message":
                if not isinstance(value, str):
                    return Response(
                        {
                            "detail": (
                                "Status message must be text."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                value = value.strip()

                if not value:
                    return Response(
                        {
                            "detail": (
                                "Status message cannot be empty."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if len(value) > 255:
                    return Response(
                        {
                            "detail": (
                                "Status message cannot exceed "
                                "255 characters."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            setattr(configuration, field, value)

        configuration.save()

        return Response({
            "id": configuration.id,
            "enabled": configuration.enabled,
            "analysis_enabled": configuration.analysis_enabled,
            "suggestions_enabled": configuration.suggestions_enabled,
            "risk_level": configuration.risk_level,
            "confidence_threshold": configuration.confidence_threshold,
            "status_message": configuration.status_message,
            "updated_at": configuration.updated_at,
            "detail": "AI configuration updated successfully.",
        })

class AdminReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = admin_required(request)

        if denied:
            return denied

        trades = Trade.objects.all()

        total_trades = trades.count()

        won_trades = trades.filter(
            result=Trade.Status.WON
        ).count()

        lost_trades = trades.filter(
            result=Trade.Status.LOST
        ).count()

        pending_trades = trades.filter(
            result=Trade.Status.PENDING
        ).count()

        cancelled_trades = trades.filter(
            result=Trade.Status.CANCELLED
        ).count()

        total_stake = (
            trades.aggregate(
                total=Sum("stake")
            )["total"]
            or Decimal("0.00")
        )

        total_profit_loss = (
            trades.aggregate(
                total=Sum("profit_loss")
            )["total"]
            or Decimal("0.00")
        )

        average_stake = (
            trades.aggregate(
                average=Avg("stake")
            )["average"]
            or Decimal("0.00")
        )

        completed_trades = won_trades + lost_trades

        if completed_trades > 0:
            win_rate = round(
                (won_trades / completed_trades) * 100,
                2,
            )
        else:
            win_rate = 0

        rise_trades = trades.filter(
            trade_type=Trade.TradeType.RISE
        ).count()

        fall_trades = trades.filter(
            trade_type=Trade.TradeType.FALL
        ).count()

        market_data = (
            trades
            .values("market")
            .annotate(
                trades=Count("id"),
                volume=Sum("stake"),
                profit_loss=Sum("profit_loss"),
            )
            .order_by("-trades")
        )

        direction_data = (
            trades
            .values("trade_type")
            .annotate(
                trades=Count("id"),
                volume=Sum("stake"),
                profit_loss=Sum("profit_loss"),
            )
            .order_by("-trades")
        )

        recent_trades = (
            trades
            .select_related("user")
            .order_by("-created_at")[:10]
        )

        recent_activity = []

        for trade in recent_trades:
            recent_activity.append({
                "id": trade.id,
                "username": trade.user.username,
                "market": trade.market,
                "trade_type": trade.trade_type,
                "stake": trade.stake,
                "result": trade.result,
                "profit_loss": trade.profit_loss,
                "created_at": trade.created_at,
            })

        return Response({
            "summary": {
                "total_trades": total_trades,
                "won_trades": won_trades,
                "lost_trades": lost_trades,
                "pending_trades": pending_trades,
                "cancelled_trades": cancelled_trades,
                "completed_trades": completed_trades,
                "win_rate": win_rate,
                "total_stake": total_stake,
                "average_stake": average_stake,
                "total_profit_loss": total_profit_loss,
                "rise_trades": rise_trades,
                "fall_trades": fall_trades,
            },

            "markets": list(market_data),

            "directions": list(direction_data),

            "recent_activity": recent_activity,

            "simulation_notice": (
                "These reports contain simulated trading "
                "activity only. They do not represent "
                "real-money transactions or financial results."
            ),
        })