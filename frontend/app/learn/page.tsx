import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

import { Panel, Badge } from '@/components/ui';
import { strategyContent } from '@/lib/strategy-content';

export default function LearnPage() {
  return (
    <div className="space-y-6 pb-10">
      <Panel className="p-6">
        <Badge>Learning hub</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Strategy Learning Center</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Learn the core idea, logic, market fit, and failure modes for each algorithm before turning it live.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {strategyContent.map((strategy) => (
          <Link key={strategy.slug} href={`/learn/${strategy.slug}`}>
            <Panel className="h-full p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <Badge>{strategy.difficulty}</Badge>
                <BookOpen className="h-4 w-4 text-sky-300" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{strategy.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{strategy.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Read lesson <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
