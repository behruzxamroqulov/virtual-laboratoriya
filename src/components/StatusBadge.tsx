const CONFIG: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Boshlanmagan', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  IN_PROGRESS: { label: 'Jarayonda', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
  SUBMITTED: { label: 'Topshirilgan', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  REVIEWED: { label: 'Tekshirilgan', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' },
  OVERDUE: { label: 'Muddati o\'tgan', className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' },
  DRAFT: { label: 'Qoralama', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  PUBLISHED: { label: "E'lon qilingan", className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  ARCHIVED: { label: 'Arxivlangan', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' }
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
