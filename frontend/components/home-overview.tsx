'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, Wallet } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { AlgoStats, Portfolio } from '@/lib/types';
import { Badge, Panel, StatCard } from '@/components/ui';

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

export function HomeOverview() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stats, setStats] = useState<Record<string, AlgoStats>>({});
  const [algorithms, setAlgorithms] = useState<StrategySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [portfolioData, statsData, algoData] = await Promise.all([
        apiGet<Portfolio>('/api/portfolio/human-user'),
        apiGet<Record<string, AlgoStats>>('/api/algo-stats'),
        apiGet<StrategySummary[]>('/api/algorithms'),
      ]);
      setPortfolio(portfolioData);
      setStats(statsData);
      setAlgorithms(algoData.filter((algo) => algo.live));
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Failed to load homepage data');
    }
  }

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  const winner = useMemo(() => {
    return [...algorithms]
      .sort((a, b) => (stats[b.user_id]?.pnl ?? Number.NEGATIVE_INFINITY) - (stats[a.user_id]?.pnl ?? Number.NEGATIVE_INFINITY))[0];
  }, [algorithms, stats]);

  return (
    <div className="space-y-6 pb-10">
      <Panel className="p-6">
        <Badge>Account overview</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">AegisTrade Control Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Submit your own orders from Trading, and your wallet and equity will update automatically as orders are filled.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCard label="Wallet cash" value={portfolio ? formatCurrency(portfolio.cash_balance) : '--'} tone="neutral" />
          <StatCard label="Portfolio equity" value={portfolio ? formatCurrency(portfolio.equity) : '--'} tone="neutral" />
          <StatCard
            label="Best live algorithm"
            value={winner ? winner.slug : '--'}
            delta={winner ? `PnL ${formatCurrency(stats[winner.user_id]?.pnl ?? 0)}` : 'Awaiting stats'}
            tone="positive"
          />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
            <Wallet className="h-4 w-4 text-emerald-300" />
            Manual trading
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Place your own orders</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Use market or limit orders from the trading console. As trades execute, wallet cash, equity, and positions refresh live.
          </p>
          <Link href="/trading" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            Open trading console <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
            <Bot className="h-4 w-4 text-sky-300" />
            Algorithm desk
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Compare all algorithms</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            View head-to-head stats, compare PnL and win rate, and inspect the current best-performing algorithm.
          </p>
          <Link href="/algorithms" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            Open algorithms page <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>
      </div>
    </div>
  );
}
