from __future__ import annotations

from decimal import Decimal
from typing import Any

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
    strategy: str | None = None
    strategy_label: str | None = None
    decision: str | None = None
    reason: str | None = None


class StrategyEventEntry(BaseModel):
    type: str
    timestamp: str
    payload: dict[str, Any]


class SystemTimeResponse(BaseModel):
    systemTime: str
    databaseTime: str | None
    streamTime: str | None


class StrategyRuntimeState(BaseModel):
    strategy: str
    user_id: str
    status: str
    last_run: str | None
    last_signal: dict[str, Any] | None
    latest_input: dict[str, Any] | None
    indicators: dict[str, Any] | None
    reason: str | None
    error: str | None
    last_trade: TradeFeedEntry | None
    trade_count: int
    recent_events: list[StrategyEventEntry]


class StrategyStatusEntry(StrategyRuntimeState):
    symbol: str
    live: bool


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


class EquityPoint(BaseModel):
    timestamp: str
    equity: float


class IndicatorPoint(BaseModel):
    timestamp: str
    value: float


class IndicatorSeries(BaseModel):
    name: str
    color: str
    points: list[IndicatorPoint]


class OrderActivityEntry(BaseModel):
    id: str
    symbol: str
    side: str
    order_type: str
    price: float | None
    quantity: int
    filled_quantity: int
    status: str
    timestamp: str


class StrategyMetrics(BaseModel):
    realized_pnl: float
    unrealized_pnl: float
    total_pnl: float
    win_rate: float
    sharpe_ratio: float | None
    total_trades: int
    avg_trade_size: float
    drawdown: float
    cash_balance: float
    equity: float


class StrategyDetailResponse(BaseModel):
    slug: str
    user_id: str
    symbol: str
    live: bool
    status: str
    last_run: str | None
    last_signal: dict[str, Any] | None
    latest_input: dict[str, Any] | None
    indicators: dict[str, Any] | None
    reason: str | None
    error: str | None
    metrics: StrategyMetrics
    current_positions: list[PortfolioPosition]
    live_trades: list[TradeFeedEntry]
    order_activity: list[OrderActivityEntry]
    equity_curve: list[EquityPoint]
    market_history: list[HistoricalBar]
    overlays: list[IndicatorSeries]
    recent_events: list[StrategyEventEntry]


class StrategyEventRequest(BaseModel):
    strategy: str = Field(..., min_length=1)
    strategy_name: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    event_type: str = Field(..., min_length=1)
    timestamp: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

