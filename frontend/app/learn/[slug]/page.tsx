import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookMarked } from 'lucide-react';

import { Badge, Panel } from '@/components/ui';
import { getStrategyContent } from '@/lib/strategy-content';
import { getDefinition } from '@/lib/trading-glossary';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Panel className="p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">{title}</div>
      <p className="mt-3 text-sm leading-7 text-zinc-200">{body}</p>
    </Panel>
  );
}

function getKeyTermsForStrategy(slug: string): string[] {
  const termMap: Record<string, string[]> = {
    'sma-crossover': ['sma', 'moving-average', 'trend', 'crossover', 'bullish', 'bearish'],
    'rsi': ['rsi', 'momentum', 'mean-reversion', 'overbought', 'oversold', 'extremes'],
    'ema-crossover': ['ema', 'exponential', 'moving-average', 'crossover', 'trend', 'momentum'],
    'bollinger-reversion': ['bollinger-bands', 'standard-deviation', 'mean-reversion', 'volatility', 'overbought', 'oversold'],
    'macd-trend': ['macd', 'momentum', 'signal-line', 'crossover', 'trend', 'ema'],
    'donchian-breakout': ['donchian-channel', 'breakout', 'trend', 'resistance', 'support', 'volatility'],
    'roc-momentum': ['roc', 'momentum', 'acceleration', 'volatility', 'trend', 'extremes'],
    'pairs-trading': ['pairs-trading', 'correlation', 'spread', 'market-neutral', 'z-score', 'mean-reversion'],
  };
  return termMap[slug] || [];
}

export default function LearnDetailPage({ params }: { params: { slug: string } }) {
  const content = getStrategyContent(params.slug);
  if (!content) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-10">
      <Panel className="p-6">
        <Link href="/learn" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          back to lessons
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge>{content.difficulty}</Badge>
          <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200">
            <BookMarked className="mr-1.5 h-3.5 w-3.5" />
            strategy primer
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{content.name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">{content.description}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="concept" body={content.concept} />
        <Section title="technical logic" body={content.technical_logic} />
        <Section title="works best when" body={content.works_when} />
        <Section title="fails when" body={content.fails_when} />
        <Section title="real-world usage" body={content.real_world_usage} />
        <Section title="visual diagram" body={content.visual_diagram} />
      </div>

      <Section title="step-by-step walkthrough" body={content.walkthrough} />

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500 flex items-center gap-2 mb-3">
          📚 key terms
        </div>
        <div className="flex flex-wrap gap-2">
              {getKeyTermsForStrategy(content.slug).map((term) => (
                <span key={term} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">{term}</span>
              ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">next actions</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={`/algorithms/${content.slug}`} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            open live strategy page
          </Link>
          <Link href="/trading" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            go to trading console
          </Link>
        </div>
      </Panel>
    </div>
  );
}
