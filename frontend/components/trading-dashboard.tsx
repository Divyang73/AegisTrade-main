'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { AlertTriangle, BarChart3, CandlestickChart, LayoutGrid, RefreshCw, Send, TrendingDown, TrendingUp } from 'lucide-react';

import { API_BASE, apiGet, apiPost } from '@/lib/api';
import type { MarketBar, MarketTick, OrderBook, Portfolio, RecentTrade } from '@/lib/types';
import { Badge, Button, Input, Panel, Select } from '@/components/ui';

type OrderFormState = {
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  quantity: string;
  price: string;
};

const SYMBOLS = ['AAPL', 'MSFT', 'TSLA'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function mapBarToPoint(bar: MarketBar) {
  return {
    time: Math.floor(new Date(bar.timestamp).getTime() / 1000),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

export function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [history, setHistory] = useState<MarketBar[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [lastTick, setLastTick] = useState<MarketTick | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrderFormState>({
    side: 'buy',
    orderType: 'limit',
    quantity: '10',
    price: '',
  });

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const latestBar = useMemo(() => {
    if (!lastTick) return null;
    return lastTick.bars.find((bar) => bar.symbol === selectedSymbol) ?? null;
  }, [lastTick, selectedSymbol]);

  async function refreshHistory() {
    const bars = await apiGet<MarketBar[]>(`/api/market/history?symbol=${selectedSymbol}&limit=180`);
    setHistory(bars);
  }

  async function refreshOrderBook() {
    const book = await apiGet<OrderBook>(`/api/orderbook/${selectedSymbol}?depth=10`);
    setOrderBook(book);
  }

  async function refreshPortfolio() {
    const portfolioData = await apiGet<Portfolio>(`/api/portfolio/human-user`);
    setPortfolio(portfolioData);
  }

  async function refreshTrades() {
    const trades = await apiGet<RecentTrade[]>('/api/trades/recent?limit=25');
    setRecentTrades(trades);
  }

  async function refreshAll() {
    try {
      await Promise.all([refreshHistory(), refreshOrderBook(), refreshPortfolio(), refreshTrades()]);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Failed to load market data');
    }
  }

  useEffect(() => {
    refreshAll();
  }, [selectedSymbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current?.remove?.();
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: '#0A0A0B' },
        textColor: '#D4D4D8',
        fontFamily: 'IBM Plex Mono, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
      crosshair: { mode: 1 },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#7EE787',
      downColor: '#FF6B6B',
      borderVisible: false,
      wickUpColor: '#7EE787',
      wickDownColor: '#FF6B6B',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth ?? 0 });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [selectedSymbol]);

  useEffect(() => {
    if (!seriesRef.current || history.length === 0) return;
    seriesRef.current.setData(history.map(mapBarToPoint));
    chartRef.current?.timeScale().fitContent();
  }, [history]);

  useEffect(() => {
    const socket = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/market`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as MarketTick;
      if (payload.type !== 'tick') return;
      setLastTick(payload);

      const activeBar = payload.bars.find((bar) => bar.symbol === selectedSymbol);
      if (activeBar && seriesRef.current) {
        seriesRef.current.update(mapBarToPoint(activeBar));
      }
    };
    socket.onerror = () => {
      setError('Live market connection interrupted');
    };
    return () => socket.close();
  }, [selectedSymbol]);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      void refreshOrderBook();
      void refreshPortfolio();
      void refreshTrades();
    }, 3000);
    return () => window.clearInterval(refreshInterval);
  }, [selectedSymbol]);

  async function handleSubmitOrder() {
    setSubmitting(true);
    try {
      const body = {
        user_id: 'human-user',
        symbol: selectedSymbol,
        side: form.side,
        order_type: form.orderType,
        price: form.orderType === 'market' ? null : Number(form.price),
        quantity: Number(form.quantity),
      };
      await apiPost('/api/orders', body);
      await Promise.all([refreshOrderBook(), refreshPortfolio(), refreshTrades()]);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Order submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const spread =
    orderBook && orderBook.bids.length > 0 && orderBook.asks.length > 0
      ? orderBook.asks[0].price - orderBook.bids[0].price
      : null;

  const notional = portfolio?.positions.reduce((sum, position) => sum + position.market_value, 0) ?? 0;
  const totalQuantity = portfolio?.positions.reduce((sum, position) => sum + position.quantity, 0) ?? 0;
  const latestReferencePrice = latestBar?.close ?? history.at(-1)?.close ?? null;
  const latestUserTrade = useMemo(() => {
    const selectedTrade = recentTrades.find(
      (trade) =>
        (trade.buyer_id === 'human-user' || trade.seller_id === 'human-user') && trade.symbol === selectedSymbol,
    );
    if (selectedTrade) return selectedTrade;

    return recentTrades.find((trade) => trade.buyer_id === 'human-user' || trade.seller_id === 'human-user') ?? null;
  }, [recentTrades, selectedSymbol]);
  const lastTradeProfit =
    latestReferencePrice != null && latestUserTrade
      ? latestUserTrade.buyer_id === 'human-user'
        ? (latestReferencePrice - latestUserTrade.price) * latestUserTrade.quantity
        : (latestUserTrade.price - latestReferencePrice) * latestUserTrade.quantity
      : null;

  return (
    <div className="space-y-6 pb-10">
      <Panel className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(126,231,135,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,179,255,0.10),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Manual trading</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Human Trader Console</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Real-time order entry, charting, and portfolio review powered directly from PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className="w-32">
              {SYMBOLS.map((symbol) => (
                <option key={symbol} value={symbol} className="bg-black">
                  {symbol}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => void refreshAll()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="Last close" value={latestBar ? formatCurrency(latestBar.close) : '--'} delta={latestBar ? `${selectedSymbol} • ${latestBar.volume.toLocaleString()} vol` : 'Waiting for market tick'} />
          <Stat label="Bid / Ask spread" value={spread != null ? formatCompact(spread) : '--'} delta={spread != null ? 'Live order book spread' : 'No book data yet'} />
          <Stat label="Portfolio equity" value={portfolio ? formatCurrency(portfolio.equity) : '--'} delta={portfolio ? `Cash ${formatCurrency(portfolio.cash_balance)} • Positions ${formatCurrency(notional)}` : 'Loading account'} />
        </div>
      </Panel>

      {error ? (
        <Panel className="flex items-center gap-3 border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr_0.95fr]">
        <Panel className="overflow-hidden p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <CandlestickChart className="h-4 w-4 text-emerald-300" />
                Candles
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">{selectedSymbol} price action</h2>
            </div>
            <Badge>{history.length} bars</Badge>
          </div>
          <div ref={chartContainerRef} className="w-full" />
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <LayoutGrid className="h-4 w-4 text-sky-300" />
                Order book
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Top of book</h2>
            </div>
            <Badge>{selectedSymbol}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-200">Bids</div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-200">Asks</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <BookSide title="Bids" rows={orderBook?.bids ?? []} tone="buy" />
            <BookSide title="Asks" rows={orderBook?.asks ?? []} tone="sell" />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-zinc-200">
              <BarChart3 className="h-4 w-4" />
              Live tape
            </div>
            <div className="mt-2 space-y-2">
              {(recentTrades.slice(0, 4) || []).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">
                    {trade.symbol} {trade.quantity} @ {formatCurrency(trade.price)}
                  </span>
                  <span className="text-zinc-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <Send className="h-4 w-4 text-amber-300" />
                Order entry
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Submit order</h2>
            </div>
            <Badge>human-user</Badge>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Side">
                <Select value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value as OrderFormState['side'] })}>
                  <option value="buy" className="bg-black">
                    Buy
                  </option>
                  <option value="sell" className="bg-black">
                    Sell
                  </option>
                </Select>
              </Field>
              <Field label="Type">
                <Select value={form.orderType} onChange={(event) => setForm({ ...form, orderType: event.target.value as OrderFormState['orderType'] })}>
                  <option value="limit" className="bg-black">
                    Limit
                  </option>
                  <option value="market" className="bg-black">
                    Market
                  </option>
                </Select>
              </Field>
            </div>

            <Field label="Quantity">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                placeholder="10"
              />
            </Field>

            <Field label="Price">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder={form.orderType === 'market' ? 'Market order' : 'Enter limit price'}
                disabled={form.orderType === 'market'}
              />
            </Field>

            <Button className="w-full" onClick={() => void handleSubmitOrder()} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Place order'}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-zinc-400">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <div className="mt-2">Buy-side liquidity</div>
              <div className="mt-1 text-white">{orderBook?.bids.length ?? 0} levels</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <TrendingDown className="h-4 w-4 text-red-300" />
              <div className="mt-2">Sell-side liquidity</div>
              <div className="mt-1 text-white">{orderBook?.asks.length ?? 0} levels</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <LayoutGrid className="h-4 w-4 text-violet-300" />
              Wallet status
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">Human wallet snapshot</h2>
          </div>
          <Badge>{portfolio ? formatCurrency(portfolio.cash_balance) : '--'}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Stat
            label="Current wallet cash"
            value={portfolio ? formatCurrency(portfolio.cash_balance) : '--'}
            delta={portfolio ? 'Available buying power' : 'Loading wallet'}
          />
          <Stat
            label="Total quantity held"
            value={portfolio ? String(totalQuantity) : '--'}
            delta={portfolio ? `Across ${portfolio.positions.length} positions` : 'Loading positions'}
          />
          <Stat
            label="Last trade profit"
            value={lastTradeProfit != null ? formatCurrency(lastTradeProfit) : '--'}
            delta={latestUserTrade ? `${latestUserTrade.symbol} • ${latestUserTrade.buyer_id === 'human-user' ? 'buy' : 'sell'} fill` : 'No user trade yet'}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="h-4 w-4 text-violet-300" />
            Wallet summary
          </div>
          <p className="mt-2 leading-6">
            This panel replaces the empty holdings table with your live wallet cash, the total quantity currently held, and the estimated profit or loss on your most recent trade using the latest market price.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-glow">
      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{delta}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function BookSide({ title, rows, tone }: { title: string; rows: { price: number; quantity: number }[]; tone: 'buy' | 'sell' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">{title}</div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-zinc-600">No levels</div>
        ) : (
          rows.map((row) => (
            <div
              key={`${title}-${row.price}`}
              className={`rounded-xl border px-3 py-2 text-xs ${tone === 'buy' ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-100' : 'border-red-500/15 bg-red-500/10 text-red-100'}`}
            >
              <div className="flex items-center justify-between">
                <span>{formatCurrency(row.price)}</span>
                <span>{row.quantity}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
