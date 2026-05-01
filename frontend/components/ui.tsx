import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes } from 'react';
import { Info } from 'lucide-react';

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
  tooltip,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  tooltip?: string;
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-300'
      : tone === 'negative'
        ? 'text-red-300'
        : 'text-white';

  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <div className={cn('mt-2 text-2xl font-semibold tabular-nums tracking-tight', toneClass)}>{value}</div>
      {delta ? <div className="mt-1 text-xs leading-5 text-zinc-500">{delta}</div> : null}
    </Panel>
  );
}

type TooltipProps = {
  content: string;
  title?: string;
};

export function Tooltip({ content, title }: TooltipProps) {
  return (
    <div className="group relative inline-flex cursor-help">
      <Info className="h-3.5 w-3.5 text-zinc-500 transition hover:text-zinc-300" />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.15] to-white/[0.05] px-3 py-2 text-xs text-white shadow-lg backdrop-blur-xl opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
        {title && <div className="font-semibold text-emerald-300">{title}</div>}
        <div className="whitespace-normal max-w-xs">{content}</div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/[0.15]" />
      </div>
    </div>
  );
}

type LabelWithTooltipProps = {
  label: string;
  tooltip?: string;
};

export function LabelWithTooltip({ label, tooltip }: LabelWithTooltipProps) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {tooltip && <Tooltip content={tooltip} />}
    </div>
  );
}
