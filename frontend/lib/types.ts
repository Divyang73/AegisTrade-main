export type MarketBar = {
  timestamp: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketTick = {
  type: 'tick';
  timestamp: string;
  bars: MarketBar[];
};

export type OrderBookLevel = {
  price: number;
  quantity: number;
};

export type OrderBook = {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
};

export type Position = {
  symbol: string;
  quantity: number;
  last_price: number;
  market_value: number;
};

export type Portfolio = {
  user_id: string;
  cash_balance: number;
  equity: number;
  positions: Position[];
};

export type AlgoStats = {
  user_id: string;
  pnl: number;
  win_rate: number;
  total_trades: number;
  cash_balance: number;
  equity: number;
};

export type RecentTrade = {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  buyer_id: string;
  seller_id: string;
  timestamp: string;
};

export type EquityPoint = {
  timestamp: string;
  equity: number;
};

export type IndicatorPoint = {
  timestamp: string;
  value: number;
};

export type IndicatorSeries = {
  name: string;
  color: string;
  points: IndicatorPoint[];
};

export type OrderActivityEntry = {
  id: string;
  symbol: string;
  side: string;
  order_type: string;
  price: number | null;
  quantity: number;
  filled_quantity: number;
  status: string;
  timestamp: string;
};

export type StrategyMetrics = {
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  win_rate: number;
  sharpe_ratio: number | null;
  total_trades: number;
  avg_trade_size: number;
  drawdown: number;
  cash_balance: number;
  equity: number;
};

export type StrategyDetail = {
  slug: string;
  user_id: string;
  symbol: string;
  live: boolean;
  metrics: StrategyMetrics;
  current_positions: Position[];
  live_trades: RecentTrade[];
  order_activity: OrderActivityEntry[];
  equity_curve: EquityPoint[];
  market_history: MarketBar[];
  overlays: IndicatorSeries[];
};

export type StrategySummary = {
  slug: string;
  user_id: string;
  symbol: string;
  live: boolean;
};
