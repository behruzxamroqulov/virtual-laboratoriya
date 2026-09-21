import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { validateUpload, uploadToBlob } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rateLimit';

/** Talaba uchun laboratoriyaga tegishli aktiv submission'ni topadi yoki yaratadi. */
async function getOrCreateSubmission(laboratoryId: string, studentId: string) {
  const existing = await prisma.submission.findUnique({ where: { laboratoryId_studentId: { laboratoryId, studentId } } });
  if (existing) return existing;
  return prisma.submission.create({ data: { laboratoryId, studentId, status: 'IN_PROGRESS' } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });

  const rl = checkRateLimit(`upload:${session.sub}`, 30, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Juda ko'p yuklash urinishi. Birozdan so'ng qayta urining." }, { status: 429 });

  const student = await prisma.studentProfile.findUnique({ where: { userId: session.sub } });
  if (!student) return NextResponse.json({ error: 'Talaba profili topilmadi.' }, { status: 404 });

  const assignment = await prisma.laboratoryAssignment.findUnique({
    where: { laboratoryId_studentId: { laboratoryId: params.id, studentId: student.id } }
  });
  if (!assignment) return NextResponse.json({ error: 'Bu laboratoriya sizga biriktirilmagan.' }, { status: 403 });

  const laboratory = await prisma.laboratory.findUnique({ where: { id: params.id } });
  if (!laboratory) return NextResponse.json({ error: 'Laboratoriya topilmadi.' }, { status: 404 });
  if (new Date() > laboratory.deadline) {
    return NextResponse.json({ error: "Deadline o'tib ketgan. Fayl yuklab bo'lmaydi." }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "So'rov formati noto'g'ri." }, { status: 400 });

  const file = formData.get('file') as File | null;
  const kind = formData.get('kind') as 'web' | 'report' | null;
  const relativePath = (formData.get('path') as string | null) || file?.name || '';

  if (!file || (kind !== 'web' && kind !== 'report')) {
    return NextResponse.json({ error: "Fayl yoki fayl turi ko'rsatilmagan." }, { status: 400 });
  }

  const validation = validateUpload(relativePath, file.type || 'application/octet-stream', file.size, kind);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const submission = await getOrCreateSubmission(params.id, student.id);
  if (submission.status === 'SUBMITTED' || submission.status === 'REVIEWED') {
    return NextResponse.json({ error: "Topshirilgan ishga fayl qo'shib bo'lmaydi." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storageKey, url } = await uploadToBlob(relativePath, buffer, file.type || 'application/octet-stream');

  if (kind === 'web') {
    let webProject = await prisma.webProject.findUnique({ where: { submissionId: submission.id } });
    if (!webProject) {
      webProject = await prisma.webProject.create({ data: { submissionId: submission.id } });
    }
    // Bir xil nomdagi fayl qayta yuklansa — eskisini almashtiramiz
    const existingFile = await prisma.webProjectFile.findFirst({ where: { webProjectId: webProject.id, fileName: relativePath } });
    if (existingFile) {
      await prisma.webProjectFile.update({
        where: { id: existingFile.id },
        data: { storageKey, url, mimeType: file.type, sizeBytes: file.size }
      });
    } else {
      await prisma.webProjectFile.create({
        data: { webProjectId: webProject.id, fileName: relativePath, storageKey, url, mimeType: file.type, sizeBytes: file.size }
      });
    }
  } else {
    const reportFile = await prisma.reportFile.create({
      data: { submissionId: submission.id, fileName: relativePath, storageKey, url, mimeType: file.type, sizeBytes: file.size }
    });
    if (assignment.status === 'NOT_STARTED') {
      await prisma.laboratoryAssignment.update({ where: { id: assignment.id }, data: { status: 'IN_PROGRESS' } });
    }
    return NextResponse.json({ ok: true, url, id: reportFile.id });
  }

  if (assignment.status === 'NOT_STARTED') {
    await prisma.laboratoryAssignment.update({ where: { id: assignment.id }, data: { status: 'IN_PROGRESS' } });
  }

  return NextResponse.json({ ok: true, url });
}
