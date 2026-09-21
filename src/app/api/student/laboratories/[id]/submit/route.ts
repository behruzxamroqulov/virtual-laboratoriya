import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });

  const student = await prisma.studentProfile.findUnique({ where: { userId: session.sub } });
  if (!student) return NextResponse.json({ error: 'Talaba profili topilmadi.' }, { status: 404 });

  const submission = await prisma.submission.findUnique({
    where: { laboratoryId_studentId: { laboratoryId: params.id, studentId: student.id } },
    include: { webProject: { include: { files: true } }, reportFiles: true }
  });

  if (!submission) return NextResponse.json({ error: "Avval fayl yuklashingiz kerak." }, { status: 400 });
  if (!submission.webProject || submission.webProject.files.length === 0) {
    return NextResponse.json({ error: "Web loyiha fayllari yuklanmagan." }, { status: 400 });
  }
  if (submission.reportFiles.length === 0) {
    return NextResponse.json({ error: "Hisobot fayli yuklanmagan." }, { status: 400 });
  }
  if (submission.status === 'SUBMITTED' || submission.status === 'REVIEWED') {
    return NextResponse.json({ error: 'Bu laboratoriya allaqachon topshirilgan.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.submission.update({ where: { id: submission.id }, data: { status: 'SUBMITTED', submittedAt: new Date() } }),
    prisma.laboratoryAssignment.updateMany({
      where: { laboratoryId: params.id, studentId: student.id },
      data: { status: 'SUBMITTED' }
    })
  ]);

  await prisma.auditLog.create({ data: { userId: session.sub, action: 'SUBMISSION_SUBMITTED', details: `lab=${params.id}` } });

  return NextResponse.json({ ok: true });
}
