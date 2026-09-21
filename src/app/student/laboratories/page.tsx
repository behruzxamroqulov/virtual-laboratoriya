import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function StudentLaboratoriesPage() {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({ where: { userId: session!.sub } });

  const assignments = await prisma.laboratoryAssignment.findMany({
    where: { studentId: student!.id, laboratory: { status: { not: 'DRAFT' } } },
    include: { laboratory: true },
    orderBy: { laboratory: { deadline: 'asc' } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Laboratoriyalarim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Sizga biriktirilgan barcha laboratoriyalar</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => (
          <Link key={a.id} href={`/student/laboratories/${a.laboratory.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">LAB #{a.laboratory.number}</span>
              <StatusBadge status={a.status} />
            </div>
            <h3 className="mb-1 font-semibold">{a.laboratory.title}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{a.laboratory.topic}</p>
            <div className="text-xs text-slate-400">Deadline: {new Date(a.laboratory.deadline).toLocaleString('uz-UZ')}</div>
          </Link>
        ))}
        {assignments.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">Hozircha sizga laboratoriya biriktirilmagan.</div>
        )}
      </div>
    </div>
  );
}
