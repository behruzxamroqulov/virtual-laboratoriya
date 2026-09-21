import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { reviewSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });
  if (!teacher) return NextResponse.json({ error: 'Ustoz profili topilmadi.' }, { status: 404 });

  const submission = await prisma.submission.findUnique({ where: { id: params.id }, include: { laboratory: true } });
  if (!submission) return NextResponse.json({ error: 'Topshiriq topilmadi.' }, { status: 404 });
  if (submission.laboratory.teacherId !== teacher.id) {
    return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ma'lumotlar noto'g'ri." }, { status: 400 });

  const { grade, feedback } = parsed.data;

  await prisma.$transaction([
    prisma.teacherReview.upsert({
      where: { submissionId: submission.id },
      create: { submissionId: submission.id, teacherId: teacher.id, grade, feedback },
      update: { grade, feedback, reviewedAt: new Date() }
    }),
    prisma.submission.update({ where: { id: submission.id }, data: { status: 'REVIEWED' } }),
    prisma.laboratoryAssignment.updateMany({
      where: { laboratoryId: submission.laboratoryId, studentId: submission.studentId },
      data: { status: 'REVIEWED' }
    })
  ]);

  await prisma.auditLog.create({ data: { userId: session?.sub, action: 'SUBMISSION_REVIEWED', details: `submission=${submission.id}` } });

  return NextResponse.json({ ok: true });
}
