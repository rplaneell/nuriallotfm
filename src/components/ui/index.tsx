import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { AlertTriangle, ChevronDown, Info, Loader2, X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import clsx from 'clsx';
import type { EvidenceStatus, SignalStrength } from '@/types';

// ---------- evidence status ----------
const STATUS: Record<EvidenceStatus, { label: string; cls: string; tip: string }> = {
  'verified-metadata': { label: 'Verified metadata', cls: 'badge-ok', tip: 'The bibliographic record was retrieved from an open index. Content has not been read by this app.' },
  'link-checked': { label: 'Link checked', cls: 'badge-ok', tip: 'The URL answered when last checked. That says nothing about its content.' },
  'source-backed': { label: 'Source-backed', cls: 'badge-data', tip: 'Tied to an identified official source. Still needs reading.' },
  interpretation: { label: 'Interpretation', cls: 'badge-warn', tip: 'A reasoned judgment by the tool author, not a finding.' },
  hypothesis: { label: 'Generated hypothesis', cls: 'badge-warn', tip: 'Provisional. Needs testing against evidence.' },
  unverified: { label: 'Unverified', cls: 'badge-bad', tip: 'Stated from background knowledge. Verify at the primary source before relying on it.' },
};
export function EvidenceBadge({ status, label }: { status: EvidenceStatus; label?: string }) {
  const s = STATUS[status];
  return <span className={clsx('badge', s.cls)} title={s.tip}>{label ?? s.label}</span>;
}

const STRENGTH: Record<SignalStrength, { label: string; cls: string }> = {
  strong: { label: 'Strong signal', cls: 'badge-ok' },
  moderate: { label: 'Moderate', cls: 'badge-data' },
  tentative: { label: 'Tentative', cls: 'badge-warn' },
  none: { label: 'No signal', cls: 'badge-muted' },
};
export function StrengthBadge({ strength, overridden }: { strength: SignalStrength; overridden?: boolean }) {
  if (overridden) return <span className="badge badge-accent">Set by you</span>;
  const s = STRENGTH[strength];
  return <span className={clsx('badge', s.cls)}>{s.label}</span>;
}

// ---------- states ----------
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" className="flex items-center gap-2 text-muted small py-6"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}</div>;
}
export function ErrorNote({ title = 'Something went wrong', children }: { title?: string; children?: ReactNode }) {
  return <div role="alert" className="flex gap-3 rounded-[var(--radius-card)] border border-bad/40 bg-bad-soft p-3 small"><AlertTriangle className="h-5 w-5 shrink-0 text-bad" aria-hidden /><div><strong>{title}</strong>{children && <div className="mt-1">{children}</div>}</div></div>;
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-rule p-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 text-muted small mx-auto max-w-prose">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
export function Notice({ tone = 'info', children, title }: { tone?: 'info' | 'warn'; children: ReactNode; title?: string }) {
  return (
    <div className={clsx('flex gap-3 rounded-[var(--radius-card)] border p-3 small', tone === 'warn' ? 'border-warn/40 bg-warn-soft' : 'border-rule bg-sunken')}>
      <Info className="h-5 w-5 shrink-0 text-muted" aria-hidden />
      <div>{title && <strong className="block">{title}</strong>}{children}</div>
    </div>
  );
}

// ---------- disclosure ----------
export function Disclosure({ title, children, defaultOpen = false, meta }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; meta?: ReactNode }) {
  return (
    <details className="group rule-t py-3" open={defaultOpen}>
      <summary className="flex items-center justify-between gap-3 rounded-[var(--radius-control)]">
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2 text-muted small">{meta}<ChevronDown className="chev h-4 w-4" aria-hidden /></span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

// ---------- meter ----------
export function Meter({ value, max = 5, label, tone }: { value: number; max?: number; label: string; tone?: 'ok' | 'warn' | 'bad' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'bad' ? 'var(--bad)' : 'var(--data)';
  return (
    <div className="meter" role="img" aria-label={`${label}: ${value.toFixed(1)} out of ${max}`}>
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
export const toneFor = (score: number) => (score >= 4 ? 'ok' : score >= 3 ? undefined : score >= 2.2 ? 'warn' : 'bad') as 'ok' | 'warn' | 'bad' | undefined;

// ---------- tabs ----------
export const Tabs = TabsPrimitive.Root;
export function TabList({ children, label }: { children: ReactNode; label: string }) {
  return <TabsPrimitive.List aria-label={label} className="flex gap-1 overflow-x-auto border-b border-rule">{children}</TabsPrimitive.List>;
}
export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <TabsPrimitive.Trigger value={value} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-[0.9375rem] font-medium text-muted transition-colors duration-150 hover:text-ink data-[state=active]:border-accent data-[state=active]:text-ink">
      {children}
    </TabsPrimitive.Trigger>
  );
}
export const TabPanel = ({ value, label, children }: { value: string; label: string; children: ReactNode }) => (
  <TabsPrimitive.Content value={value} className="pt-5 outline-none focus-visible:outline-accent">
    <h2 className="sr-only">{label}</h2>
    {children}
  </TabsPrimitive.Content>
);

// ---------- dialog ----------
export function Dialog({ open, onOpenChange, title, description, children, side = false }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; side?: boolean }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay" />
        <DialogPrimitive.Content className={clsx('dialog', side ? 'dialog-side' : 'dialog-center')} aria-describedby={description ? undefined : undefined}>
          <div className="flex items-start justify-between gap-4 rule-b p-4">
            <div>
              <DialogPrimitive.Title asChild><h2>{title}</h2></DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 small text-muted">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="btn btn-ghost btn-icon btn-sm" aria-label="Close"><X className="h-4 w-4" aria-hidden /></DialogPrimitive.Close>
          </div>
          <div className="p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------- slider ----------
export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, valueText }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; valueText?: string }) {
  return (
    <SliderPrimitive.Root className="slider-root" value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} aria-label={label}>
      <SliderPrimitive.Track className="slider-track"><SliderPrimitive.Range className="slider-range" /></SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="slider-thumb" aria-label={label} aria-valuetext={valueText ?? String(value)} />
    </SliderPrimitive.Root>
  );
}

// ---------- tooltip ----------
export function Hint({ children, label }: { children: ReactNode; label: string }) {
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-ink" aria-label={label}><Info className="h-4 w-4" aria-hidden /></button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content sideOffset={6} className="tooltip z-[60] max-w-xs rounded-[var(--radius-control)] border border-rule bg-surface p-3 small">{children}</TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// ---------- form helpers ----------
export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return <label htmlFor={htmlFor} className="block small font-medium">{children}{hint && <span className="ml-2 font-normal text-muted">{hint}</span>}</label>;
}
export function SelectField<T extends string>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id} hint={hint}>{label}</Label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className="chip" onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="statement">{title}</h1>
      {children && <div className="mt-3 text-muted prose-calm">{children}</div>}
    </header>
  );
}
