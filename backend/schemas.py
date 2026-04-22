from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class OrderRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    symbol: str = Field(..., min_length=1)
    side: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = Field(..., pattern="^(market|limit)$")
    price: Decimal | None = None
    quantity: int = Field(..., gt=0)


class PortfolioPosition(BaseModel):
    symbol: str
    quantity: int
    last_price: float
    market_value: float


class PortfolioResponse(BaseModel):
    user_id: str
    cash_balance: float
    equity: float
    positions: list[PortfolioPosition]


class AlgoStatsResponse(BaseModel):
    user_id: str
    pnl: float
    win_rate: float
    total_trades: int
    cash_balance: float
    equity: float


class TradeFeedEntry(BaseModel):
    id: str
    symbol: str
    price: float
    quantity: int
    buyer_id: str
    seller_id: str
    timestamp: str


class OrderBookLevel(BaseModel):
    price: float
    quantity: int


class OrderBookResponse(BaseModel):
    symbol: str
    bids: list[OrderBookLevel]
    asks: list[OrderBookLevel]


class HistoricalBar(BaseModel):
    timestamp: str
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: int

