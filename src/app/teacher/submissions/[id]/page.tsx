import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import ReviewForm from './ReviewForm';
import { ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { student: true, laboratory: true, review: true, reportFiles: true, webProject: { include: { files: true } } }
  });

  if (!submission) return notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{submission.student.firstName} {submission.student.lastName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            LAB #{submission.laboratory.number} — {submission.laboratory.title}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4 text-sm">
          <div className="text-slate-400">Topshirilgan</div>
          <div className="mt-1 font-medium">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('uz-UZ') : '—'}</div>
        </div>
        <div className="card p-4 text-sm">
          <div className="text-slate-400">Web fayllar</div>
          <div className="mt-1 font-medium">{submission.webProject?.files.length || 0} ta</div>
        </div>
        <div className="card p-4 text-sm">
          <div className="text-slate-400">Hisobot fayllari</div>
          <div className="mt-1 font-medium">{submission.reportFiles.length} ta</div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Web loyiha</h3>
        {submission.webProject && submission.webProject.files.length > 0 ? (
          <Link
            href={`/preview/${submission.id}`}
            target="_blank"
            className="btn-secondary"
          >
            <ExternalLink size={15} /> Virtual Lab'da ochish
          </Link>
        ) : (
          <p className="text-sm text-slate-400">Talaba hali web loyiha yuklamagan.</p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Hisobot fayllari</h3>
        {submission.reportFiles.length === 0 ? (
          <p className="text-sm text-slate-400">Hisobot fayli yuklanmagan.</p>
        ) : (
          <ul className="space-y-2">
            {submission.reportFiles.map((f) => (
              <li key={f.id}>
                <a href={f.url} target="_blank" className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                  <FileText size={15} /> {f.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Baholash</h3>
        <ReviewForm submissionId={submission.id} initialGrade={submission.review?.grade ?? undefined} initialFeedback={submission.review?.feedback ?? ''} />
      </div>
    </div>
  );
}
