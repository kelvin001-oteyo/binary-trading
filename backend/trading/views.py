from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from trading.models import Trade
from trading.serializers import (
    CreateTradeSerializer,
    TradeSerializer,
)
from trading.services import (
    create_demo_trade,
    settle_demo_trade,
)


class TradeListView(generics.ListAPIView):
    serializer_class = TradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trade.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class TradeDetailView(generics.RetrieveAPIView):
    serializer_class = TradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trade.objects.filter(
            user=self.request.user
        )


class CreateTradeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateTradeSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        try:
            trade = create_demo_trade(
                user=request.user,
                market=serializer.validated_data["market"],
                trade_type=serializer.validated_data[
                    "trade_type"
                ],
                stake=serializer.validated_data["stake"],
                entry_price=serializer.validated_data[
                    "entry_price"
                ],
                duration_seconds=serializer.validated_data[
                    "duration_seconds"
                ],
            )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            TradeSerializer(trade).data,
            status=status.HTTP_201_CREATED,
        )


class SettleTradeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            trade = Trade.objects.get(
                pk=pk,
                user=request.user,
            )

        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            trade = settle_demo_trade(
                trade=trade
            )

        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            TradeSerializer(trade).data,
            status=status.HTTP_200_OK,
        )