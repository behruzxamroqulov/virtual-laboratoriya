import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { Users, FlaskConical, CheckCircle2, Clock, AlarmClock } from 'lucide-react';

export default async function TeacherDashboardPage() {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });
  if (!teacher) return null;

  const [studentCount, labCount, submittedCount, pendingCount, upcomingDeadlines, recentSubmissions] = await Promise.all([
    prisma.studentProfile.count({ where: { deletedAt: null } }),
    prisma.laboratory.count({ where: { teacherId: teacher.id, deletedAt: null } }),
    prisma.submission.count({ where: { status: 'SUBMITTED', laboratory: { teacherId: teacher.id } } }),
    prisma.submission.count({ where: { status: 'SUBMITTED', review: null, laboratory: { teacherId: teacher.id } } }),
    prisma.laboratory.findMany({
      where: { teacherId: teacher.id, deletedAt: null, status: 'PUBLISHED', deadline: { gte: new Date() } },
      orderBy: { deadline: 'asc' },
      take: 5
    }),
    prisma.submission.findMany({
      where: { laboratory: { teacherId: teacher.id } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: { student: true, laboratory: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Boshqaruv paneli</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Umumiy statistika va so'nggi faoliyat</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami talabalar" value={studentCount} icon={Users} />
        <StatCard label="Jami laboratoriyalar" value={labCount} icon={FlaskConical} />
        <StatCard label="Topshirilgan ishlar" value={submittedCount} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Tekshirilmagan ishlar" value={pendingCount} icon={Clock} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <AlarmClock size={16} /> Deadline yaqin laboratoriyalar
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400">Yaqin deadline'li laboratoriya yo'q.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((lab) => (
                <li key={lab.id} className="flex items-center justify-between text-sm">
                  <Link href={`/teacher/laboratories/${lab.id}`} className="font-medium hover:text-brand-600">
                    LAB #{lab.number} — {lab.title}
                  </Link>
                  <span className="text-slate-400">{new Date(lab.deadline).toLocaleString('uz-UZ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold">So'nggi topshiriqlar</h3>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-slate-400">Hozircha topshiriqlar yo'q.</p>
          ) : (
            <ul className="space-y-3">
              {recentSubmissions.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <Link href={`/teacher/submissions/${s.id}`} className="font-medium hover:text-brand-600">
                    {s.student.firstName} {s.student.lastName} — LAB #{s.laboratory.number}
                  </Link>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
