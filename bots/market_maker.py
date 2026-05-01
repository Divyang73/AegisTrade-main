from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from typing import Any

import http_client
import websockets

from strategy_telemetry import StrategyTelemetryClient


API_URL = os.getenv("API_URL", "http://localhost:8000")
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/market")
USER_ID = os.getenv("MARKET_MAKER_USER_ID", "market-maker")
ORDER_QTY = int(os.getenv("MARKET_MAKER_ORDER_QTY", "5"))
STRATEGY_NAME = "Market Maker"
STRATEGY_SLUG = "market-maker"

# adaptive spread settings
VOLATILITY_WINDOW = int(os.getenv("MARKET_MAKER_VOL_WINDOW", "20"))
BASE_SPREAD = float(os.getenv("MARKET_MAKER_BASE_SPREAD", "0.001"))
VOLATILITY_MULTIPLIER = float(os.getenv("MARKET_MAKER_VOL_MULTIPLIER", "1.0"))
MIN_SPREAD = float(os.getenv("MARKET_MAKER_MIN_SPREAD", "0.0001"))
MAX_SPREAD = float(os.getenv("MARKET_MAKER_MAX_SPREAD", "0.01"))

telemetry = StrategyTelemetryClient(STRATEGY_NAME, STRATEGY_SLUG, USER_ID)


class RollingVolatility:
    """tracks rolling volatility from recent prices."""
    
    def __init__(self, window: int = VOLATILITY_WINDOW):
        self.window = window
        self.prices: dict[str, deque[float]] = {}
        self.volatilities: dict[str, float] = {}
    
    def update(self, symbol: str, price: float) -> float:
        """update price history and return rolling volatility."""
        if symbol not in self.prices:
            self.prices[symbol] = deque(maxlen=self.window)
            self.volatilities[symbol] = 0.0
        
        prices = self.prices[symbol]
        prices.append(price)
        
        if len(prices) < 2:
            return self.volatilities[symbol]
        
        # build returns for the rolling window
        returns = []
        for i in range(1, len(prices)):
            ret = (prices[i] - prices[i - 1]) / prices[i - 1]
            returns.append(ret)
        
        if len(returns) > 1:
            # update volatility estimate
            mean_ret = sum(returns) / len(returns)
            variance = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
            volatility = variance ** 0.5
            self.volatilities[symbol] = volatility
        
        return self.volatilities[symbol]
    
    def get(self, symbol: str) -> float:
        """get current volatility for symbol."""
        return self.volatilities.get(symbol, 0.0)


rolling_volatility = RollingVolatility()


def _calculate_adaptive_spread(price: float, volatility: float) -> float:
    """return a bounded spread from price and volatility."""
    spread = BASE_SPREAD + VOLATILITY_MULTIPLIER * volatility * price
    spread = max(MIN_SPREAD, min(spread, MAX_SPREAD))
    return spread


def _post_order(symbol: str, side: str, price: float, spread: float) -> None:
    """post a limit order at a spread-adjusted price."""
    if side == "buy":
        order_price = price * (1 - spread)
    else:
        order_price = price * (1 + spread)
    
    payload = {
        "user_id": USER_ID,
        "symbol": symbol,
        "side": side,
        "order_type": "limit",
        "price": round(order_price, 4),
        "quantity": ORDER_QTY,
    }
    response = http_client.post(f"{API_URL}/api/orders", json=payload, timeout=10)
    response.raise_for_status()


async def run() -> None:
    telemetry.init()
    while True:
        try:
            async with websockets.connect(WS_URL, ping_interval=20, ping_timeout=20) as websocket:
                async for message in websocket:
                    payload: dict[str, Any] = json.loads(message)
                    if payload.get("type") != "tick":
                        continue

                    for bar in payload.get("bars", []):
                        timestamp = str(bar.get("timestamp") or payload.get("timestamp") or "")
                        telemetry.run(timestamp)
                        close = float(bar["close"])
                        symbol = str(bar["symbol"])
                        
                        volatility = rolling_volatility.update(symbol, close)
                        spread = _calculate_adaptive_spread(close, volatility)
                        
                        telemetry.signal(
                            price=close,
                            indicators={
                                "spread": spread,
                                "volatility": volatility,
                                "order_qty": ORDER_QTY,
                            },
                            decision="QUOTE",
                            reason=f"Posting bid and ask liquidity quotes with adaptive spread ({spread:.6f})",
                            timestamp=timestamp,
                            input_data={"price": close, "symbol": symbol},
                        )
                        _post_order(symbol, "buy", close, spread)
                        _post_order(symbol, "sell", close, spread)

        except Exception as exc:
            telemetry.crash(exc)
            print(f"[market-maker] reconnecting after error: {exc}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(run())
