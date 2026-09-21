import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function LaboratoryDetailPage({ params }: { params: { id: string } }) {
  const lab = await prisma.laboratory.findUnique({
    where: { id: params.id },
    include: {
      assignments: { include: { student: true } },
      submissions: { include: { student: true, review: true } }
    }
  });

  if (!lab) return notFound();

  const submissionByStudent = new Map(lab.submissions.map((s) => [s.studentId, s]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">LAB #{lab.number}</span>
          <h1 className="text-xl font-semibold">{lab.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{lab.topic}</p>
        </div>
        <StatusBadge status={lab.status} />
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

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 p-4 text-sm font-semibold dark:border-slate-800">
          Biriktirilgan talabalar ({lab.assignments.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">Talaba</th>
              <th className="px-4 py-3">Guruh</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-4 py-3 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {lab.assignments.map((a) => {
              const submission = submissionByStudent.get(a.studentId);
              return (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.student.firstName} {a.student.lastName}</td>
                  <td className="px-4 py-3 text-slate-500">{a.student.group}</td>
                  <td className="px-4 py-3"><StatusBadge status={submission?.status || a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {submission ? (
                      <Link href={`/teacher/submissions/${submission.id}`} className="text-brand-600 hover:underline">Ko'rish</Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
