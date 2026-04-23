'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, type UTCTimestamp } from 'lightweight-charts';
import { BookOpen, ChartCandlestick, Clock3, RefreshCw, Scale, Wallet } from 'lucide-react';

import { apiGet } from '@/lib/api';
import { getStrategyContent, type StrategyContent } from '@/lib/strategy-content';
import type { StrategyDetail } from '@/lib/types';
import { Badge, Button, Panel, StatCard } from '@/components/ui';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function mapBarToPoint(bar: StrategyDetail['market_history'][number]) {
  return {
    time: Math.floor(new Date(bar.timestamp).getTime() / 1000) as UTCTimestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

function mapLinePoint(point: StrategyDetail['overlays'][number]['points'][number]) {
  return {
    time: Math.floor(new Date(point.timestamp).getTime() / 1000) as UTCTimestamp,
    value: point.value,
  };
}

export function StrategyDetailDashboard({ slug }: { slug: string }) {
  const [detail, setDetail] = useState<StrategyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);

  const content: StrategyContent | undefined = useMemo(() => getStrategyContent(slug), [slug]);

  async function refresh() {
    try {
      const result = await apiGet<StrategyDetail>(`/api/algorithms/${slug}`);
      setDetail(result);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Failed to load strategy details');
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 4500);

    return () => window.clearInterval(interval);
  }, [slug]);

  useEffect(() => {
    if (!chartContainerRef.current || !detail) return;

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

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#7EE787',
      downColor: '#FF6B6B',
      borderVisible: false,
      wickUpColor: '#7EE787',
      wickDownColor: '#FF6B6B',
    });

    candleSeries.setData(detail.market_history.map(mapBarToPoint));

    detail.overlays.forEach((overlay) => {
      const lineSeries = chart.addLineSeries({
        color: overlay.color,
        lineWidth: 2,
        title: overlay.name,
      });
      lineSeries.setData(overlay.points.map(mapLinePoint));
    });

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth ?? 0 });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [detail]);

  if (!content) {
    return (
      <Panel className="p-6">
        <h1 className="text-xl font-semibold text-white">Unknown strategy</h1>
        <p className="mt-2 text-sm text-zinc-400">No strategy content exists for slug: {slug}</p>
      </Panel>
    );
  }

  const metrics = detail?.metrics;

  return (
    <div className="space-y-6 pb-10">
      <Panel className="overflow-hidden p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>{content.difficulty}</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{content.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">{content.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/learn/${content.slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.14]">
              <BookOpen className="h-4 w-4" />
              Learn strategy
            </Link>
            <Button variant="secondary" onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total PnL" value={metrics ? formatCurrency(metrics.total_pnl) : '--'} tone={metrics && metrics.total_pnl >= 0 ? 'positive' : 'negative'} />
          <StatCard label="Win Rate" value={metrics ? formatPercent(metrics.win_rate) : '--'} tone="neutral" />
          <StatCard label="Sharpe Ratio" value={metrics?.sharpe_ratio != null ? formatNumber(metrics.sharpe_ratio) : '--'} tone="neutral" />
          <StatCard label="Total Trades" value={metrics ? String(metrics.total_trades) : '--'} tone="neutral" />
          <StatCard label="Drawdown" value={metrics ? formatPercent(metrics.drawdown) : '--'} tone="negative" />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <ChartCandlestick className="h-4 w-4 text-emerald-300" />
                Strategy chart
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">{detail?.symbol ?? 'AAPL'} market and overlays</h2>
            </div>
            <Badge>{detail?.live ? 'Live' : 'Planned'}</Badge>
          </div>
          <div ref={chartContainerRef} className="w-full" />
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <Wallet className="h-4 w-4 text-sky-300" />
                Position and PnL
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Current account state</h2>
            </div>
            <Badge>{detail?.user_id ?? '--'}</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cash balance</div>
              <div className="mt-2 text-xl font-semibold text-white">{metrics ? formatCurrency(metrics.cash_balance) : '--'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Equity</div>
              <div className="mt-2 text-xl font-semibold text-white">{metrics ? formatCurrency(metrics.equity) : '--'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Avg trade size</div>
              <div className="mt-2 text-xl font-semibold text-white">{metrics ? formatNumber(metrics.avg_trade_size) : '--'}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <Scale className="h-4 w-4 text-emerald-300" />
            Current positions
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {(detail?.current_positions ?? []).map((position) => (
                  <tr key={`${position.symbol}-${position.quantity}`} className="border-t border-white/5 text-zinc-200">
                    <td className="px-3 py-2">{position.symbol}</td>
                    <td className="px-3 py-2">{position.quantity}</td>
                    <td className="px-3 py-2">{formatCurrency(position.market_value)}</td>
                  </tr>
                ))}
                {(detail?.current_positions.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                      No open positions
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <Clock3 className="h-4 w-4 text-violet-300" />
            Live trades
          </div>
          <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#101012] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {(detail?.live_trades ?? []).map((trade) => (
                  <tr key={trade.id} className="border-t border-white/5 text-zinc-200">
                    <td className="px-3 py-2 text-xs text-zinc-500">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">{formatCurrency(trade.price)}</td>
                    <td className="px-3 py-2">{trade.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <Clock3 className="h-4 w-4 text-amber-300" />
            Order activity
          </div>
          <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#101012] text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(detail?.order_activity ?? []).map((order) => (
                  <tr key={order.id} className="border-t border-white/5 text-zinc-200">
                    <td className="px-3 py-2">{order.side}</td>
                    <td className="px-3 py-2">{order.order_type}</td>
                    <td className="px-3 py-2">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
