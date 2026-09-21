import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { FlaskConical, CheckCircle2, Clock, AlarmClock } from 'lucide-react';

export default async function StudentDashboardPage() {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({ where: { userId: session!.sub } });
  if (!student) return null;

  const assignments = await prisma.laboratoryAssignment.findMany({
    where: { studentId: student.id },
    include: { laboratory: true }
  });

  const now = new Date();
  const total = assignments.length;
  const submitted = assignments.filter((a) => a.status === 'SUBMITTED' || a.status === 'REVIEWED').length;
  const inProgress = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const overdue = assignments.filter((a) => a.status === 'NOT_STARTED' && a.laboratory.deadline < now).length;

  const upcoming = assignments
    .filter((a) => a.laboratory.status === 'PUBLISHED' && a.laboratory.deadline >= now && a.status !== 'SUBMITTED' && a.status !== 'REVIEWED')
    .sort((a, b) => a.laboratory.deadline.getTime() - b.laboratory.deadline.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Assalomu alaykum, {student.firstName}!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sizning laboratoriya faoliyatingiz</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami laboratoriyalar" value={total} icon={FlaskConical} />
        <StatCard label="Jarayonda" value={inProgress} icon={Clock} tone="amber" />
        <StatCard label="Topshirilgan" value={submitted} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Muddati o'tgan" value={overdue} icon={AlarmClock} tone="red" />
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold">Yaqin deadline'li laboratoriyalar</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Yaqin deadline'li laboratoriya yo'q.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <Link href={`/student/laboratories/${a.laboratory.id}`} className="font-medium hover:text-brand-600">
                  LAB #{a.laboratory.number} — {a.laboratory.title}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{new Date(a.laboratory.deadline).toLocaleString('uz-UZ')}</span>
                  <StatusBadge status={a.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
