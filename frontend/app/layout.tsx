import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'AegisTrade',
  description: 'An educational trading simulator with a PostgreSQL matching engine.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-hidden bg-[#0A0A0B] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(126,231,135,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,179,255,0.12),_transparent_28%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,32px_32px,32px_32px] opacity-70" />
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
            <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-glow backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/trading" className="text-lg font-semibold tracking-[0.18em] text-white">
                  AEGISTRADE
                </Link>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  PostgreSQL-powered simulation engine
                </p>
              </div>

              <nav className="flex items-center gap-2 text-sm">
                <Link className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06]" href="/trading">
                  Trading
                </Link>
                <Link className="rounded-xl border border-white/10 px-4 py-2 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06]" href="/algorithms">
                  Algorithms
                </Link>
              </nav>
            </header>
            <main className="relative flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
