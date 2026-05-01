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
  strategy?: string | null;
  strategy_label?: string | null;
  decision?: string | null;
  reason?: string | null;
};

export type SystemTime = {
  systemTime: string;
  databaseTime: string | null;
  streamTime: string | null;
};

export type StrategyEvent = {
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type StrategySignal = Record<string, unknown> | null;

export type StrategyRuntime = {
  strategy: string;
  user_id: string;
  status: string;
  last_run: string | null;
  last_signal: StrategySignal;
  latest_input: Record<string, unknown> | null;
  indicators: Record<string, unknown> | null;
  reason: string | null;
  error: string | null;
  last_trade: RecentTrade | null;
  trade_count: number;
  recent_events: StrategyEvent[];
};

export type StrategyStatus = StrategyRuntime & {
  symbol: string;
  live: boolean;
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
  status: string;
  last_run: string | null;
  last_signal: StrategySignal;
  latest_input: Record<string, unknown> | null;
  indicators: Record<string, unknown> | null;
  reason: string | null;
  error: string | null;
  metrics: StrategyMetrics;
  current_positions: Position[];
  live_trades: RecentTrade[];
  order_activity: OrderActivityEntry[];
  equity_curve: EquityPoint[];
  market_history: MarketBar[];
  overlays: IndicatorSeries[];
  recent_events: StrategyEvent[];
};

export type StrategySummary = {
  slug: string;
  user_id: string;
  symbol: string;
  live: boolean;
};
