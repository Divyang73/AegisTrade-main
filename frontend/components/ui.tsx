import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes } from 'react';

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type PanelProps = HTMLAttributes<HTMLDivElement>;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] shadow-glow backdrop-blur-xl',
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
    primary: 'bg-white text-black hover:bg-zinc-200',
    secondary: 'bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/10',
    ghost: 'bg-transparent text-white hover:bg-white/[0.06] border border-transparent',
    danger: 'bg-red-500/90 text-white hover:bg-red-500',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50',
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
        'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10',
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
        'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10',
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
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300',
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
      <div className={cn('mt-2 text-2xl font-semibold', toneClass)}>{value}</div>
      {delta ? <div className="mt-1 text-xs text-zinc-500">{delta}</div> : null}
    </Panel>
  );
}
