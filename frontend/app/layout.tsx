import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';
import { ServerClock } from '@/components/server-clock';

export const metadata: Metadata = {
  title: 'AegisTrade',
  description: 'An educational trading simulator with a PostgreSQL matching engine.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-hidden bg-[#070708] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(126,231,135,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,179,255,0.12),_transparent_28%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,32px_32px,32px_32px] opacity-70" />
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
            <header className="mb-6 flex flex-col gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-5 py-4 shadow-glow backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/trading" className="text-lg font-semibold tracking-[0.18em] text-white">
                  AEGISTRADE
                </Link>
                <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(126,231,135,0.7)]" />
                  Live matching engine
                  <span className="text-zinc-700">•</span>
                  PostgreSQL-powered simulation
                </div>
              </div>

              <nav className="flex items-center gap-2 text-sm">
                <Link className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-white" href="/trading">
                  Trading
                </Link>
                <Link className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-white" href="/algorithms">
                  Algorithms
                </Link>
                <Link className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-white" href="/learn">
                  Learn
                </Link>
                <ServerClock />
              </nav>
            </header>
            <main className="relative flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
