'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bot, RefreshCw, ShieldAlert, SquareTerminal } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { RecentTrade, StrategyStatus, SystemTime } from '@/lib/types';
import { Badge, Button, Panel, StatCard } from '@/components/ui';

function formatClock(value: string | null) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function statusTone(status: string) {
  if (status === 'error') return 'border-red-500/30 bg-red-500/10 text-red-200';
  if (status === 'no_signals') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'active';
    case 'no_signals':
      return 'no signals';
    case 'error':
      return 'error';
    default:
      return 'not running';
  }
}

export function SystemStateDashboard() {
  const [systemTime, setSystemTime] = useState<SystemTime | null>(null);
  const [strategies, setStrategies] = useState<StrategyStatus[]>([]);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [timeData, strategyData, tradeData] = await Promise.all([
        apiGet<SystemTime>('/api/system-time'),
        apiGet<StrategyStatus[]>('/api/strategy-status'),
        apiGet<RecentTrade[]>('/api/trades/recent?limit=16'),
      ]);

      setSystemTime(timeData);
      setStrategies(strategyData);
      setTrades(tradeData);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'failed to load system state');
    }
  }

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedStrategy && strategies.length > 0) {
      setSelectedStrategy(strategies[0].strategy);
    }
  }, [selectedStrategy, strategies]);

  const selected = useMemo(
    () => strategies.find((strategy) => strategy.strategy === selectedStrategy) ?? null,
    [selectedStrategy, strategies],
  );

  const activeCount = strategies.filter((strategy) => strategy.status === 'active').length;
  const errorCount = strategies.filter((strategy) => strategy.status === 'error').length;
  const idleCount = strategies.filter((strategy) => strategy.status === 'no_signals' || strategy.status === 'not_running').length;
  const latestPrice = trades[0]?.price ?? null;

  return (
    <Panel className="overflow-hidden p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge>system observability</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">global clock + system state dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            monitor the current system time, data-time position, live trades, and the latest runtime signal from each strategy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setDebugMode((value) => !value)}>
            <SquareTerminal className="h-4 w-4" />
            debug mode {debugMode ? 'on' : 'off'}
          </Button>
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            refresh
          </Button>
        </div>
      </div>

      {error ? <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="system time" value={formatTime(systemTime?.systemTime ?? null)} delta={systemTime ? formatClock(systemTime.systemTime) : 'awaiting sync'} tone="neutral" />
        <StatCard
          label="database time"
          value={formatTime(systemTime?.databaseTime ?? null)}
          delta={systemTime?.streamTime ? `stream ${formatClock(systemTime.streamTime)}` : 'awaiting sync'}
          tone="neutral"
        />
        <StatCard label="live trades" value={String(trades.length)} delta={latestPrice ? `latest price ${formatCompactNumber(latestPrice)}` : 'no fills yet'} tone="neutral" />
        <StatCard label="strategy health" value={String(activeCount)} delta={`${errorCount} errors • ${idleCount} idle`} tone={errorCount > 0 ? 'negative' : 'positive'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                <Bot className="h-4 w-4 text-sky-300" />
                strategy activity
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">current state of every live strategy</h2>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">click a row for debug</div>
          </div>

          <div className="space-y-3">
            {strategies.map((strategy) => {
              const isSelected = selectedStrategy === strategy.strategy;
              return (
                <button
                  key={strategy.strategy}
                  type="button"
                  onClick={() => setSelectedStrategy(strategy.strategy)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-emerald-400/30 bg-emerald-400/8' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{strategy.strategy}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${statusTone(strategy.status)}`}>{statusLabel(strategy.status)}</span>
                        {strategy.live ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-emerald-200">live</span> : <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">planned</span>}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {strategy.symbol} • last run {strategy.last_run ? formatClock(strategy.last_run) : '--'} • trades {strategy.trade_count}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      <div>
                        last signal:{' '}
                        {strategy.last_signal && typeof strategy.last_signal === 'object'
                          ? String((strategy.last_signal as Record<string, unknown>)['decision'] ?? 'no trade')
                          : 'no trade'}
                      </div>
                      <div className="mt-1">reason: {strategy.reason ?? 'waiting for evaluation'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  strategy debug view
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">latest input, indicators, signal, and no-trade reason</h2>
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{debugMode ? 'raw telemetry visible' : 'compact view'}</div>
            </div>

            {selected ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <StatCard label="selected strategy" value={selected.strategy} delta={`${selected.user_id} • ${selected.symbol}`} tone={selected.status === 'error' ? 'negative' : 'neutral'} />
                  <StatCard label="runtime status" value={statusLabel(selected.status)} delta={selected.last_run ? `last run ${formatClock(selected.last_run)}` : 'no heartbeat yet'} tone={selected.status === 'error' ? 'negative' : selected.status === 'active' ? 'positive' : 'neutral'} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">latest input</div>
                    <pre className="mt-3 overflow-auto text-xs leading-6 text-zinc-200">{JSON.stringify(selected.latest_input ?? {}, null, 2)}</pre>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">indicators</div>
                    <pre className="mt-3 overflow-auto text-xs leading-6 text-zinc-200">{JSON.stringify(selected.indicators ?? {}, null, 2)}</pre>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">last signal</div>
                    <pre className="mt-3 overflow-auto text-xs leading-6 text-zinc-200">{JSON.stringify(selected.last_signal ?? {}, null, 2)}</pre>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">reason for no trade</div>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">{selected.reason ?? 'the strategy has not emitted a no-trade reason yet.'}</p>
                    {selected.error ? <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{selected.error}</div> : null}
                  </div>
                </div>

                {debugMode ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      <ShieldAlert className="h-4 w-4 text-violet-300" />
                      recent events
                    </div>
                    <div className="mt-3 max-h-[280px] space-y-2 overflow-auto pr-1">
                      {selected.recent_events.length > 0 ? selected.recent_events.map((event) => (
                        <div key={`${event.type}-${event.timestamp}`} className="rounded-xl border border-white/8 bg-white/[0.04] p-3 text-xs text-zinc-300">
                          <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                            <span>{event.type}</span>
                            <span>{formatClock(event.timestamp)}</span>
                          </div>
                          <pre className="mt-2 overflow-auto text-[11px] leading-5 text-zinc-200">{JSON.stringify(event.payload, null, 2)}</pre>
                        </div>
                      )) : <div className="text-sm text-zinc-500">no events received yet.</div>}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-400">select a strategy to inspect its latest runtime telemetry.</div>
            )}
          </Panel>

          <Panel className="p-4">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
              <Activity className="h-4 w-4 text-emerald-300" />
              live trade stream
            </div>
            <div className="space-y-3">
              {trades.length > 0 ? trades.map((trade) => (
                <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">{trade.strategy_label ?? trade.strategy ?? `${trade.symbol} trade`}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {trade.symbol} • {trade.quantity} @ {formatCompactNumber(trade.price)} • {trade.timestamp}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      <div>{trade.decision ?? 'trade executed'}</div>
                      <div className="mt-1">{trade.reason ?? `${trade.buyer_id} vs ${trade.seller_id}`}</div>
                    </div>
                  </div>
                </div>
              )) : <div className="text-sm text-zinc-500">no recent trades available.</div>}
            </div>
          </Panel>
        </div>
      </div>
    </Panel>
  );
}