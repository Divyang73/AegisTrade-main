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
