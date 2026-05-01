'use client';

import { useEffect, useState } from 'react';

import { apiGet } from '@/lib/api';
import type { SystemTime } from '@/lib/types';

function formatServerTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatServerDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ServerClock() {
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [databaseTime, setDatabaseTime] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;

    async function syncClock() {
      try {
        const payload = await apiGet<SystemTime>('/api/system-time');
        if (cancelled) {
          return;
        }

        const serverDate = new Date(payload.systemTime);
        setServerTime(serverDate);
        setDatabaseTime(payload.databaseTime ? new Date(payload.databaseTime) : null);

        const startMs = Date.now();
        timerId = window.setInterval(() => {
          const elapsedMs = Date.now() - startMs;
          setServerTime(new Date(serverDate.getTime() + elapsedMs));
        }, 1000);
      } catch {
        if (!cancelled) {
          setServerTime(new Date());
        }
      }
    }

    void syncClock();

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        window.clearInterval(timerId);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-2">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Global clock</span>
        <span className="text-[11px] text-zinc-400">{serverTime ? formatServerDate(serverTime) : 'Syncing date...'}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-emerald-200">
          {serverTime ? formatServerTime(serverTime) : 'Syncing...'} UTC
        </span>
        <span className="text-[11px] text-zinc-500">
          {databaseTime ? `Data ${formatServerDate(databaseTime)} ${formatServerTime(databaseTime)} UTC` : 'Data syncing...'}
        </span>
      </div>
    </div>
  );
}