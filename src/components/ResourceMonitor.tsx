'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cpu, Database, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

type Stats = {
  timestamp: string;
  memory: { heapUsedBytes: number; heapTotalBytes: number; rssBytes: number; usedPercent: number };
  storage: { usedBytes: number; quotaBytes: number; usedPercent: number; fileCount: number };
  cache: { rateLimitEntries: number };
  overallPercent: number;
  warning: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let val = bytes / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

function barColor(percent: number) {
  if (percent >= 70) return 'bg-red-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-emerald-500';
}

/**
 * Server xotirasi (heap), fayl storage kvotasi va rate-limit keshini
 * har 5 soniyada so'rab, real vaqtda ko'rsatadi. 70% chegaraga yetganda
 * ko'zga ko'rinadigan ogohlantirish chiqaradi va "Keshni tozalash"
 * tugmasi orqali rate-limit keshini bo'shatish imkonini beradi.
 */
export default function ResourceMonitor({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setStats(await res.json());
      setError('');
    } catch {
      setError("Monitoring ma'lumotini olishda xatolik.");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  async function handleClearCache() {
    setClearing(true);
    try {
      await fetch('/api/monitoring/clear-cache', { method: 'POST' });
      await fetchStats();
    } finally {
      setClearing(false);
    }
  }

  if (variant === 'compact') {
    if (!stats) return null;
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
        <span className={`h-2 w-2 rounded-full ${barColor(stats.overallPercent)}`} />
        Resurs: {stats.overallPercent}%
        {stats.warning && <AlertTriangle size={14} className="text-red-500" />}
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Cpu size={16} /> Real vaqtli resurs monitoringi
        </h3>
        <button onClick={fetchStats} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Yangilash">
          <RefreshCw size={15} />
        </button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      {!stats ? (
        <div className="text-sm text-slate-400">Yuklanmoqda...</div>
      ) : (
        <div className="space-y-4">
          {stats.warning && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <strong>Ogohlantirish:</strong> resurs sarfi 70% chegarasidan oshdi ({stats.overallPercent}%).
                Keshni tozalashni yoki storage kvotasini oshirishni ko'rib chiqing.
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Server xotirasi (heap)</span>
              <span>{formatBytes(stats.memory.heapUsedBytes)} / {formatBytes(stats.memory.heapTotalBytes)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full ${barColor(stats.memory.usedPercent)}`} style={{ width: `${Math.min(stats.memory.usedPercent, 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1"><Database size={12} /> Fayl storage ({stats.storage.fileCount} ta fayl)</span>
              <span>{formatBytes(stats.storage.usedBytes)} / {formatBytes(stats.storage.quotaBytes)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full ${barColor(stats.storage.usedPercent)}`} style={{ width: `${Math.min(stats.storage.usedPercent, 100)}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-slate-800/60">
            <span>Rate-limit kesh yozuvlari: <strong>{stats.cache.rateLimitEntries}</strong></span>
            <button onClick={handleClearCache} disabled={clearing} className="btn-secondary !px-3 !py-1.5 text-xs">
              <Trash2 size={14} /> {clearing ? 'Tozalanmoqda...' : 'Keshni tozalash'}
            </button>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            Yangilangan: {new Date(stats.timestamp).toLocaleTimeString('uz-UZ')}
          </div>
        </div>
      )}
    </div>
  );
}
