'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, BookOpen, LineChart, RefreshCw, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { AlgoStats, RecentTrade, StrategyDetail } from '@/lib/types';
import { getStrategyContent } from '@/lib/strategy-content';
import { getDefinition } from '@/lib/trading-glossary';
import { Badge, Button, Panel, StatCard, Tooltip } from '@/components/ui';

type AlgoStatsResponse = Record<string, AlgoStats>;
type StrategySummary = {
  slug: string;
  user_id: string;
  symbol: string;
  live: boolean;
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

function formatNumber(value: number | null | undefined) {
  if (value == null) {
    return '--';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

export function AlgorithmDashboard() {
  const [stats, setStats] = useState<AlgoStatsResponse | null>(null);
  const [details, setDetails] = useState<Record<string, StrategyDetail>>({});
  const [algorithms, setAlgorithms] = useState<StrategySummary[]>([]);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [statsData, tradesData, algoData] = await Promise.all([
        apiGet<AlgoStatsResponse>('/api/algo-stats'),
        apiGet<RecentTrade[]>('/api/trades/recent?limit=50'),
        apiGet<StrategySummary[]>('/api/algorithms'),
      ]);

      const detailResponses = await Promise.allSettled(algoData.map((algo) => apiGet<StrategyDetail>(`/api/algorithms/${algo.slug}`)));
      const detailMap: Record<string, StrategyDetail> = {};
      detailResponses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          detailMap[algoData[index].user_id] = result.value;
        }
      });

      setStats(statsData);
      setTrades(tradesData);
      setAlgorithms(algoData);
      setDetails(detailMap);
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

  const liveAlgorithms = algorithms.filter((algo) => algo.live);
  const rankedLive = [...liveAlgorithms].sort((a, b) => {
    const aPnl = stats?.[a.user_id]?.pnl ?? Number.NEGATIVE_INFINITY;
    const bPnl = stats?.[b.user_id]?.pnl ?? Number.NEGATIVE_INFINITY;
    return bPnl - aPnl;
  });
  const rankedAll = [...algorithms].sort((a, b) => {
    const aPnl = stats?.[a.user_id]?.pnl ?? Number.NEGATIVE_INFINITY;
    const bPnl = stats?.[b.user_id]?.pnl ?? Number.NEGATIVE_INFINITY;
    return bPnl - aPnl;
  });
  const winner = rankedLive[0];
  const worst = rankedLive.at(-1);
  const top = winner ? stats?.[winner.user_id] : null;
  const bottom = worst ? stats?.[worst.user_id] : null;

  return (
    <div className="space-y-6 pb-10">
      <Panel className="overflow-hidden p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Algorithm performance</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Bot Desk</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              A live comparison of all active algorithms, sourced entirely from the database trade and order ledger.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh stats
          </Button>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCard label="Top performer" value={winner && top ? formatCurrency(top.pnl) : '--'} delta={winner ? winner.slug : 'Awaiting stats'} tone={top && top.pnl >= 0 ? 'positive' : 'negative'} />
          <StatCard label="Trailing strategy" value={worst && bottom ? formatCurrency(bottom.pnl) : '--'} delta={worst ? worst.slug : 'Awaiting stats'} tone={bottom && bottom.pnl >= 0 ? 'positive' : 'negative'} />
          <StatCard label="Live algorithms" value={String(liveAlgorithms.length)} delta="Connected to strategy registry" tone="neutral" />
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <LineChart className="h-4 w-4 text-sky-300" />
              Algorithm comparison table
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">All algorithms and technical stats</h2>
          </div>
          <Link href="/learn" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/[0.12]">
            Learn center
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('pnl')}>PnL</Tooltip>
                </th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('win-rate')}>Win Rate</Tooltip>
                </th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('sharpe')}>Sharpe</Tooltip>
                </th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('drawdown')}>Drawdown</Tooltip>
                </th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('win-loss-ratio')}>Trades</Tooltip>
                </th>
                <th className="px-4 py-3">
                  <Tooltip definition={getDefinition('avg-trade')}>Avg Trade</Tooltip>
                </th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {rankedAll.map((algo) => {
                const entry = stats?.[algo.user_id];
                const metrics = details[algo.user_id]?.metrics;
                const content = getStrategyContent(algo.slug);
                const isBest = algo.live && winner?.slug === algo.slug;

                return (
                  <tr key={algo.slug} className={`border-t border-white/5 text-zinc-200 ${isBest ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{content?.name ?? algo.slug}</div>
                      <div className="mt-1 text-xs text-zinc-500">{algo.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${algo.live ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200' : 'border-amber-500/30 bg-amber-500/15 text-amber-200'}`}>
                        {algo.live ? 'Live' : 'Planned'}
                      </span>
                      {isBest ? <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-200">Best</span> : null}
                    </td>
                    <td className="px-4 py-3">{entry ? formatCurrency(entry.pnl) : '--'}</td>
                    <td className="px-4 py-3">{entry ? formatPercent(entry.win_rate) : '--'}</td>
                    <td className="px-4 py-3">{formatNumber(metrics?.sharpe_ratio)}</td>
                    <td className="px-4 py-3">{metrics ? formatPercent(metrics.drawdown) : '--'}</td>
                    <td className="px-4 py-3">{entry ? entry.total_trades : metrics?.total_trades ?? '--'}</td>
                    <td className="px-4 py-3">{metrics ? formatCurrency(metrics.avg_trade_size) : '--'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/algorithms/${algo.slug}`} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-100 transition hover:bg-white/[0.12]">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <BookOpen className="h-4 w-4 text-sky-300" />
              Strategy pages
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">Open a strategy workspace</h2>
          </div>
          <Link href="/learn" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/[0.12]">
            Learn center
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {algorithms.map((algo) => {
            const entry = stats?.[algo.user_id];
            const content = getStrategyContent(algo.slug);
            return (
              <Panel key={algo.slug} className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={algo.live ? '' : 'border-amber-500/20 bg-amber-500/10 text-amber-200'}>{algo.live ? 'Live' : 'Planned'}</Badge>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{algo.symbol}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">{content?.name ?? algo.slug}</h3>
                <p className="mt-2 min-h-[48px] text-sm text-zinc-400">{content?.description ?? 'Strategy details and learning module.'}</p>
                <div className="mt-3 text-xs text-zinc-500">{entry ? `PnL ${formatCurrency(entry.pnl)} • Trades ${entry.total_trades}` : 'No live metrics yet'}</div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/algorithms/${algo.slug}`} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-100 transition hover:bg-white/[0.12]">
                    Strategy
                  </Link>
                  <Link href={`/learn/${algo.slug}`} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-100 transition hover:bg-white/[0.12]">
                    Learn
                  </Link>
                </div>
              </Panel>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-200">
                <TrendingUp className="h-4 w-4" />
                Momentum read
              </div>
              <div className="mt-2 text-lg font-semibold">Trend models now include SMA, EMA, MACD, Donchian breakouts, and ROC momentum.</div>
              <div className="mt-1 text-emerald-200/80">The ranking is based on live PnL, and every row opens the dedicated strategy page.</div>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-sky-200">
                <TrendingDown className="h-4 w-4" />
                Risk read
              </div>
              <div className="mt-2 text-lg font-semibold">RSI, Bollinger, and mean-reversion systems target pullbacks and extremes.</div>
              <div className="mt-1 text-sky-200/80">Sharpe, drawdown, and average trade size are pulled from each strategy’s detail metrics.</div>
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
              This feed streams the most recent bot executions from the trades table, so you can inspect live fill price, size, symbol activity, and execution cadence.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
