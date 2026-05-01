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
  const [dataTime, setDataTime] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncClock() {
      try {
        const payload = await apiGet<SystemTime>('/api/system-time');
        if (cancelled) {
          return;
        }

        const serverDate = new Date(payload.systemTime);
        setServerTime(serverDate);
        const dataTimestamp = payload.streamTime ?? payload.databaseTime;
        setDataTime(dataTimestamp ? new Date(dataTimestamp) : null);
      } catch {
        if (!cancelled) {
          setServerTime(new Date());
        }
      }
    }

    void syncClock();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-2">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">global clock</span>
        <span className="text-[11px] text-zinc-400">{serverTime ? formatServerDate(serverTime) : 'syncing date...'}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-emerald-200">
          {serverTime ? formatServerTime(serverTime) : 'syncing...'} utc
        </span>
        <span className="text-[11px] text-zinc-500">
          {dataTime ? `data ${formatServerDate(dataTime)} ${formatServerTime(dataTime)} utc` : 'data syncing...'}
        </span>
      </div>
    </div>
  );
}