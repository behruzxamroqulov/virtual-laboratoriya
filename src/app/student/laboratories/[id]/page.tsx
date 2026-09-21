import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { Code2 } from 'lucide-react';

export default async function StudentLaboratoryDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({ where: { userId: session!.sub } });

  const assignment = await prisma.laboratoryAssignment.findUnique({
    where: { laboratoryId_studentId: { laboratoryId: params.id, studentId: student!.id } },
    include: { laboratory: true }
  });

  if (!assignment) return notFound();
  const lab = assignment.laboratory;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">LAB #{lab.number}</span>
          <h1 className="text-xl font-semibold">{lab.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{lab.topic}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-500">Tavsif</h3>
          <p className="text-sm whitespace-pre-wrap">{lab.description}</p>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-500">Topshiriq</h3>
          <p className="text-sm whitespace-pre-wrap">{lab.task}</p>
        </div>
        {lab.instructions && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-500">Ko'rsatmalar</h3>
            <p className="text-sm whitespace-pre-wrap">{lab.instructions}</p>
          </div>
        )}
        <div className="text-sm text-slate-500">
          Deadline: <strong>{new Date(lab.deadline).toLocaleString('uz-UZ')}</strong>
        </div>
      </div>

      <Link href={`/student/laboratories/${lab.id}/workspace`} className="btn-primary">
        <Code2 size={16} /> Ishchi muhitga o'tish
      </Link>
    </div>
  );
}
