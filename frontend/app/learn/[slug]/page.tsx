import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookMarked } from 'lucide-react';

import { Badge, Panel, Tooltip } from '@/components/ui';
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
          Back to lessons
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge>{content.difficulty}</Badge>
          <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-200">
            <BookMarked className="mr-1.5 h-3.5 w-3.5" />
            Strategy primer
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{content.name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">{content.description}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Concept" body={content.concept} />
        <Section title="Technical Logic" body={content.technical_logic} />
        <Section title="Works Best When" body={content.works_when} />
        <Section title="Fails When" body={content.fails_when} />
        <Section title="Real-World Usage" body={content.real_world_usage} />
        <Section title="Visual Diagram" body={content.visual_diagram} />
      </div>

      <Section title="Step-by-Step Walkthrough" body={content.walkthrough} />

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500 flex items-center gap-2 mb-3">
          📚 Key Terms
        </div>
        <div className="flex flex-wrap gap-2">
          {getKeyTermsForStrategy(content.slug).map((term) => (
            <Tooltip key={term} definition={getDefinition(term)}>
              <span className="inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                {term.replace(/-/g, ' ')}
              </span>
            </Tooltip>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Next actions</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={`/algorithms/${content.slug}`} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            Open live strategy page
          </Link>
          <Link href="/trading" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]">
            Go to trading console
          </Link>
        </div>
      </Panel>
    </div>
  );
}
