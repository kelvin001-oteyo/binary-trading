from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from trading.models import Trade
from wallet.models import Wallet


PAYOUT_RATE = Decimal("0.80")
SIMULATED_PRICE_MOVEMENT = Decimal("0.0005")


@transaction.atomic
def create_demo_trade(
    user,
    market,
    trade_type,
    stake,
    entry_price,
    duration_seconds=60,
):
    stake = Decimal(str(stake))
    entry_price = Decimal(str(entry_price))

    if stake <= 0:
        raise ValueError(
            "Stake must be greater than zero."
        )

    if entry_price <= 0:
        raise ValueError(
            "Entry price must be greater than zero."
        )

    if duration_seconds <= 0:
        raise ValueError(
            "Duration must be greater than zero."
        )

    if trade_type not in [
        Trade.TradeType.RISE,
        Trade.TradeType.FALL,
    ]:
        raise ValueError(
            "Invalid trade type."
        )

    wallet = Wallet.objects.select_for_update().get(
        user=user
    )

    if wallet.balance < stake:
        raise ValueError(
            "Insufficient demo balance."
        )

    wallet.balance -= stake

    wallet.save(
        update_fields=[
            "balance",
            "updated_at",
        ]
    )

    expires_at = timezone.now() + timezone.timedelta(
        seconds=duration_seconds
    )

    trade = Trade.objects.create(
        user=user,
        market=market,
        trade_type=trade_type,
        stake=stake,
        entry_price=entry_price,
        duration_seconds=duration_seconds,
        expires_at=expires_at,
        result=Trade.Status.PENDING,
        profit_loss=Decimal("0.00"),
    )

    return trade


@transaction.atomic
def settle_demo_trade(trade):
    trade = (
        Trade.objects
        .select_for_update()
        .select_related("user")
        .get(id=trade.id)
    )

    if trade.result != Trade.Status.PENDING:
        raise ValueError(
            "This trade has already been settled."
        )

    if timezone.now() < trade.expires_at:
        raise ValueError(
            "This trade has not expired yet."
        )

    wallet = Wallet.objects.select_for_update().get(
        user=trade.user
    )

    entry_price = Decimal(
        str(trade.entry_price)
    )

    # -------------------------------------------------
    # DEMO MARKET SIMULATION
    # -------------------------------------------------
    # The backend determines whether the simulated
    # market moves up or down.
    #
    # Using the trade ID makes the demo deterministic
    # while still producing both winning and losing
    # outcomes across multiple trades.
    # -------------------------------------------------

    if trade.id % 2 == 0:
        movement = SIMULATED_PRICE_MOVEMENT
    else:
        movement = -SIMULATED_PRICE_MOVEMENT

    exit_price = entry_price + movement

    # Determine whether the selected direction
    # matched the simulated market movement.
    if trade.trade_type == Trade.TradeType.RISE:
        won = movement > 0
    else:
        won = movement < 0

    trade.exit_price = exit_price

    if won:
        profit = trade.stake * PAYOUT_RATE
        returned_amount = trade.stake + profit

        trade.result = Trade.Status.WON
        trade.profit_loss = profit

        wallet.balance += returned_amount

    else:
        trade.result = Trade.Status.LOST
        trade.profit_loss = -trade.stake

    trade.save(
        update_fields=[
            "exit_price",
            "result",
            "profit_loss",
            "updated_at",
        ]
    )

    wallet.save(
        update_fields=[
            "balance",
            "updated_at",
        ]
    )

    return trade