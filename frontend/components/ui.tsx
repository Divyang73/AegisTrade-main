import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes } from 'react';

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type PanelProps = HTMLAttributes<HTMLDivElement>;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.03] shadow-glow backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-emerald-300 text-black hover:bg-emerald-200 shadow-[0_0_0_1px_rgba(126,231,135,0.25)]',
    secondary: 'bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/10',
    ghost: 'bg-transparent text-white hover:bg-white/[0.06] border border-transparent',
    danger: 'bg-red-500/90 text-white hover:bg-red-500 shadow-[0_0_0_1px_rgba(255,107,107,0.25)]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/10',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-sm text-white outline-none transition duration-200 focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/10',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-300'
      : tone === 'negative'
        ? 'text-red-300'
        : 'text-white';

  return (
    <Panel className="p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={cn('mt-2 text-2xl font-semibold tabular-nums tracking-tight', toneClass)}>{value}</div>
      {delta ? <div className="mt-1 text-xs leading-5 text-zinc-500">{delta}</div> : null}
    </Panel>
  );
}

// Tooltip helpers removed intentionally.
