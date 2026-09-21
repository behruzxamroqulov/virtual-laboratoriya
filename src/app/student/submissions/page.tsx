import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

export default async function StudentSubmissionsPage() {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({ where: { userId: session!.sub } });

  const submissions = await prisma.submission.findMany({
    where: { studentId: student!.id },
    orderBy: { updatedAt: 'desc' },
    include: { laboratory: true, review: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Topshiriqlarim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Barcha topshirilgan va jarayondagi ishlaringiz</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">Laboratoriya</th>
              <th className="px-4 py-3">Topshirilgan</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Ball</th>
              <th className="px-4 py-3">Izoh</th>
              <th className="px-4 py-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">LAB #{s.laboratory.number} — {s.laboratory.title}</td>
                <td className="px-4 py-3 text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleString('uz-UZ') : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">{s.review?.grade ?? '—'}</td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-500">{s.review?.feedback || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/student/laboratories/${s.laboratory.id}`} className="text-brand-600 hover:underline">Ko'rish</Link>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Hozircha topshiriq yo'q.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
