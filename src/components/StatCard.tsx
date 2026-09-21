import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'amber' | 'emerald' | 'red';
}) {
  const toneClasses: Record<string, string> = {
    default: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-semibold leading-none">{value}</div>
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}
