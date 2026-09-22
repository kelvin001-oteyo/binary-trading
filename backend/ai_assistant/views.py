from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_assistant.services import get_ai_configuration


class AIAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        configuration = get_ai_configuration()

        if not configuration.enabled:
            return Response(
                {
                    "detail": "AI assistant is currently disabled.",
                    "enabled": False,
                },
                status=403,
            )

        if not configuration.analysis_enabled:
            return Response(
                {
                    "detail": "AI analysis is currently disabled.",
                    "enabled": True,
                    "analysis_enabled": False,
                },
                status=403,
            )

        market = request.data.get(
            "market",
            "DEMO/USD",
        )

        price = request.data.get("price")
        previous_price = request.data.get("previous_price")

        if price is None or previous_price is None:
            return Response(
                {
                    "detail": (
                        "price and previous_price "
                        "are required."
                    )
                },
                status=400,
            )

        try:
            current_price = float(price)
            previous = float(previous_price)

        except (TypeError, ValueError):
            return Response(
                {
                    "detail": (
                        "Prices must be numeric."
                    )
                },
                status=400,
            )

        if current_price > previous:
            trend = "UP"

        elif current_price < previous:
            trend = "DOWN"

        else:
            trend = "FLAT"

        return Response(
            {
                "market": market,
                "current_price": current_price,
                "previous_price": previous,
                "trend": trend,
                "risk_level": configuration.risk_level,
                "confidence_threshold": (
                    configuration.confidence_threshold
                ),
                "suggestions_enabled": (
                    configuration.suggestions_enabled
                ),
                "analysis": (
                    f"{market} is currently showing "
                    f"a {trend.lower()} movement based "
                    f"on the provided prices."
                ),
                "risk_note": (
                    "This is simulated analysis for "
                    "the demo platform and is not a "
                    "guarantee of a profitable trade."
                ),
                "status_message": (
                    configuration.status_message
                ),
            }
        )