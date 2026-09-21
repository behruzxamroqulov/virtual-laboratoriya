import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function TeacherSubmissionsPage() {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });

  const submissions = await prisma.submission.findMany({
    where: { laboratory: { teacherId: teacher!.id } },
    orderBy: { updatedAt: 'desc' },
    include: { student: true, laboratory: true, review: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Topshiriqlar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Barcha talaba topshiriqlari</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">Talaba</th>
              <th className="px-4 py-3">Laboratoriya</th>
              <th className="px-4 py-3">Topshirilgan</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3">Ball</th>
              <th className="px-4 py-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.student.firstName} {s.student.lastName}</td>
                <td className="px-4 py-3">LAB #{s.laboratory.number} — {s.laboratory.title}</td>
                <td className="px-4 py-3 text-slate-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleString('uz-UZ') : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">{s.review?.grade ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/teacher/submissions/${s.id}`} className="text-brand-600 hover:underline">Ko'rish</Link>
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
