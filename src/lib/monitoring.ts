import { prisma } from './db';
import { rateLimitCacheSize } from './rateLimit';

const STORAGE_QUOTA_BYTES = Number(process.env.STORAGE_QUOTA_BYTES || 5 * 1024 * 1024 * 1024); // default 5 GB

export type ResourceStats = {
  timestamp: string;
  memory: {
    heapUsedBytes: number;
    heapTotalBytes: number;
    rssBytes: number;
    usedPercent: number; // heapUsed / heapTotal
  };
  storage: {
    usedBytes: number;
    quotaBytes: number;
    usedPercent: number;
    fileCount: number;
  };
  cache: {
    rateLimitEntries: number;
  };
  overallPercent: number; // memory va storage ichidan eng yuqorisi — ogohlantirish shu asosda beriladi
  warning: boolean; // true agar overallPercent >= 70
};

/**
 * Umumiy resurs holatini hisoblaydi:
 *  - "memory": joriy Node.js process'ining heap xotirasi (Vercel funksiyasi nusxasi darajasida)
 *  - "storage": talabalar yuklagan web-project va hisobot fayllarining umumiy hajmi,
 *    STORAGE_QUOTA_BYTES konfiguratsiyasiga nisbatan foiz sifatida
 *  - "cache": rate-limit xotirasidagi yozuvlar soni (Keshni tozalash tugmasi shuni tozalaydi)
 */
export async function getResourceStats(): Promise<ResourceStats> {
  const mem = process.memoryUsage();
  const memPercent = mem.heapTotal > 0 ? (mem.heapUsed / mem.heapTotal) * 100 : 0;

  const [webAgg, reportAgg] = await Promise.all([
    prisma.webProjectFile.aggregate({ _sum: { sizeBytes: true }, _count: { _all: true } }),
    prisma.reportFile.aggregate({ _sum: { sizeBytes: true }, _count: { _all: true } })
  ]);

  const usedBytes = (webAgg._sum.sizeBytes || 0) + (reportAgg._sum.sizeBytes || 0);
  const fileCount = (webAgg._count._all || 0) + (reportAgg._count._all || 0);
  const storagePercent = STORAGE_QUOTA_BYTES > 0 ? (usedBytes / STORAGE_QUOTA_BYTES) * 100 : 0;

  const overallPercent = Math.max(memPercent, storagePercent);

  return {
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      rssBytes: mem.rss,
      usedPercent: Math.round(memPercent * 10) / 10
    },
    storage: {
      usedBytes,
      quotaBytes: STORAGE_QUOTA_BYTES,
      usedPercent: Math.round(storagePercent * 10) / 10,
      fileCount
    },
    cache: {
      rateLimitEntries: rateLimitCacheSize()
    },
    overallPercent: Math.round(overallPercent * 10) / 10,
    warning: overallPercent >= 70
  };
}
