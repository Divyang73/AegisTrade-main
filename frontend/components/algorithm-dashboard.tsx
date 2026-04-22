'use client';

import { useEffect, useState } from 'react';
import { Activity, LineChart, RefreshCw, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { AlgoStats, RecentTrade } from '@/lib/types';
import { Badge, Button, Panel, StatCard } from '@/components/ui';

type AlgoStatsResponse = {
  'algo-sma': AlgoStats;
  'algo-rsi': AlgoStats;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function AlgorithmDashboard() {
  const [stats, setStats] = useState<AlgoStatsResponse | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [statsData, tradesData] = await Promise.all([
        apiGet<AlgoStatsResponse>('/api/algo-stats'),
        apiGet<RecentTrade[]>('/api/trades/recent?limit=50'),
      ]);
      setStats(statsData);
      setTrades(tradesData);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Failed to load algorithm dashboard');
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  const sma = stats?.['algo-sma'];
  const rsi = stats?.['algo-rsi'];

  const winner = !sma || !rsi ? null : sma.pnl >= rsi.pnl ? 'algo-sma' : 'algo-rsi';

  return (
    <div className="space-y-6 pb-10">
      <Panel className="overflow-hidden p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Algorithm performance</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Bot Desk</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              A live comparison of the SMA and RSI strategies, sourced entirely from the database and trade ledger.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh stats
          </Button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCard label="algo-sma PnL" value={sma ? formatCurrency(sma.pnl) : '--'} delta={sma ? `Trades ${sma.total_trades}` : 'Loading'} tone={sma && sma.pnl >= 0 ? 'positive' : 'negative'} />
          <StatCard label="algo-rsi PnL" value={rsi ? formatCurrency(rsi.pnl) : '--'} delta={rsi ? `Trades ${rsi.total_trades}` : 'Loading'} tone={rsi && rsi.pnl >= 0 ? 'positive' : 'negative'} />
          <StatCard label="Active leader" value={winner ?? '--'} delta={winner ? 'Highest mark-to-market equity' : 'Awaiting stats'} tone="neutral" />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <LineChart className="h-4 w-4 text-sky-300" />
                Comparison grid
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Strategy metrics</h2>
            </div>
            <Badge>live</Badge>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Strategy</th>
                  <th className="px-4 py-3">PnL</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Trades</th>
                </tr>
              </thead>
              <tbody>
                {(['algo-sma', 'algo-rsi'] as const).map((name) => {
                  const entry = stats?.[name];
                  return (
                    <tr key={name} className="border-t border-white/5 text-zinc-200">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3">{entry ? formatCurrency(entry.pnl) : '--'}</td>
                      <td className="px-4 py-3">{entry ? formatPercent(entry.win_rate) : '--'}</td>
                      <td className="px-4 py-3">{entry ? entry.total_trades : '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-200">
                <TrendingUp className="h-4 w-4" />
                Momentum read
              </div>
              <div className="mt-2 text-lg font-semibold">SMA crossovers drive directional exposure.</div>
              <div className="mt-1 text-emerald-200/80">This desk uses the live order ledger only. No in-memory matching.</div>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-sky-200">
                <TrendingDown className="h-4 w-4" />
                Risk read
              </div>
              <div className="mt-2 text-lg font-semibold">RSI mean reversion catches overshoots.</div>
              <div className="mt-1 text-sky-200/80">Win rate is derived from the trade book versus the latest close.</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <Activity className="h-4 w-4 text-violet-300" />
                Recent fills
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Bot trade feed</h2>
            </div>
            <Badge>{trades.length}</Badge>
          </div>

          <div className="max-h-[640px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#101012] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Qty</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-t border-white/5 text-zinc-200">
                    <td className="px-4 py-3 text-xs text-zinc-500">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                    <td className="px-4 py-3">{formatCurrency(trade.price)}</td>
                    <td className="px-4 py-3">{trade.quantity}</td>
                  </tr>
                ))}
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      No trades yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Database-native execution
            </div>
            <p className="mt-2 leading-6">
              Orders are placed through the API, routed into PostgreSQL, and matched with row-level locks. The browser only renders the results.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
