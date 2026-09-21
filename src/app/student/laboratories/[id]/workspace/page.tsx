import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import WorkspaceClient from './WorkspaceClient';

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return '';
    return res.text();
  } catch {
    return '';
  }
}

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({ where: { userId: session!.sub } });

  const assignment = await prisma.laboratoryAssignment.findUnique({
    where: { laboratoryId_studentId: { laboratoryId: params.id, studentId: student!.id } },
    include: { laboratory: true }
  });
  if (!assignment) return notFound();

  const submission = await prisma.submission.findUnique({
    where: { laboratoryId_studentId: { laboratoryId: params.id, studentId: student!.id } },
    include: { webProject: { include: { files: true } }, reportFiles: true }
  });

  const files = submission?.webProject?.files || [];
  const htmlFile = files.find((f) => f.fileName.toLowerCase() === 'index.html');
  const cssFile = files.find((f) => f.fileName.toLowerCase() === 'style.css');
  const jsFile = files.find((f) => f.fileName.toLowerCase() === 'script.js');

  const [html, css, js] = await Promise.all([
    htmlFile ? fetchText(htmlFile.url) : Promise.resolve(assignment.laboratory.starterHtml || DEFAULT_HTML),
    cssFile ? fetchText(cssFile.url) : Promise.resolve(DEFAULT_CSS),
    jsFile ? fetchText(jsFile.url) : Promise.resolve(DEFAULT_JS)
  ]);

  const isLocked = submission?.status === 'SUBMITTED' || submission?.status === 'REVIEWED';
  const isDeadlinePassed = new Date() > assignment.laboratory.deadline;

  return (
    <WorkspaceClient
      laboratoryId={params.id}
      laboratoryTitle={`LAB #${assignment.laboratory.number} — ${assignment.laboratory.title}`}
      submissionId={submission?.id || null}
      submissionStatus={submission?.status || 'NOT_STARTED'}
      isLocked={isLocked}
      isDeadlinePassed={isDeadlinePassed && !isLocked}
      initialHtml={html}
      initialCss={css}
      initialJs={js}
      reportFiles={(submission?.reportFiles || []).map((f) => ({ id: f.id, fileName: f.fileName, url: f.url }))}
    />
  );
}

const DEFAULT_HTML = `<!doctype html>
<html lang="uz">
<head>
  <meta charset="UTF-8" />
  <title>Mening loyiham</title>
</head>
<body>
  <h1>Salom, Virtual Lab!</h1>
  <button id="btn">Bosing</button>
  <script src="script.js"></script>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: sans-serif;
  padding: 24px;
  background: #f8fafc;
}`;

const DEFAULT_JS = `document.getElementById('btn').addEventListener('click', () => {
  alert('Interaktiv element ishlayapti!');
});`;
