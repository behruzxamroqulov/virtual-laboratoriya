import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { deleteFromBlob } from '@/lib/storage';

export async function DELETE(req: NextRequest, { params }: { params: { fileId: string } }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });

  const student = await prisma.studentProfile.findUnique({ where: { userId: session.sub } });
  if (!student) return NextResponse.json({ error: 'Topilmadi.' }, { status: 404 });

  const kind = req.nextUrl.searchParams.get('kind');

  if (kind === 'web') {
    const file = await prisma.webProjectFile.findUnique({ where: { id: params.fileId }, include: { webProject: { include: { submission: true } } } });
    if (!file || file.webProject.submission.studentId !== student.id) return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
    if (file.webProject.submission.status !== 'IN_PROGRESS' && file.webProject.submission.status !== 'NOT_STARTED') {
      return NextResponse.json({ error: "Topshirilgan ishdan fayl o'chirib bo'lmaydi." }, { status: 400 });
    }
    await deleteFromBlob(file.url);
    await prisma.webProjectFile.delete({ where: { id: file.id } });
  } else {
    const file = await prisma.reportFile.findUnique({ where: { id: params.fileId }, include: { submission: true } });
    if (!file || file.submission.studentId !== student.id) return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
    if (file.submission.status !== 'IN_PROGRESS' && file.submission.status !== 'NOT_STARTED') {
      return NextResponse.json({ error: "Topshirilgan ishdan fayl o'chirib bo'lmaydi." }, { status: 400 });
    }
    await deleteFromBlob(file.url);
    await prisma.reportFile.delete({ where: { id: file.id } });
  }

  return NextResponse.json({ ok: true });
}
