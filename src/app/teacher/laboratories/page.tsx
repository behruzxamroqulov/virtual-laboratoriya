import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Plus } from 'lucide-react';

export default async function LaboratoriesPage() {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });
  const labs = await prisma.laboratory.findMany({
    where: { teacherId: teacher!.id, deletedAt: null },
    orderBy: { number: 'asc' },
    include: { _count: { select: { assignments: true, submissions: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Laboratoriyalar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Barcha laboratoriya topshiriqlari</p>
        </div>
        <Link href="/teacher/laboratories/create" className="btn-primary">
          <Plus size={16} /> Yangi laboratoriya
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => (
          <Link key={lab.id} href={`/teacher/laboratories/${lab.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">LAB #{lab.number}</span>
              <StatusBadge status={lab.status} />
            </div>
            <h3 className="mb-1 font-semibold">{lab.title}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{lab.topic}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{lab._count.assignments} talaba biriktirilgan</span>
              <span>{new Date(lab.deadline).toLocaleDateString('uz-UZ')}</span>
            </div>
          </Link>
        ))}
        {labs.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">Hozircha laboratoriya yaratilmagan.</div>
        )}
      </div>
    </div>
  );
}
