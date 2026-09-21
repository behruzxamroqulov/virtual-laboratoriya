import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { createLaboratorySchema } from '@/lib/validation';

export async function GET() {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });
  const laboratories = await prisma.laboratory.findMany({
    where: { teacherId: teacher!.id, deletedAt: null },
    orderBy: { number: 'asc' },
    include: { _count: { select: { assignments: true, submissions: true } } }
  });
  return NextResponse.json({ laboratories });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session!.sub } });
  if (!teacher) return NextResponse.json({ error: 'Ustoz profili topilmadi.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createLaboratorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri." }, { status: 400 });
  }

  const { studentIds, ...data } = parsed.data;

  const lab = await prisma.laboratory.create({
    data: {
      ...data,
      teacherId: teacher.id,
      assignments: {
        create: studentIds.map((studentId) => ({ studentId }))
      }
    }
  });

  await prisma.auditLog.create({ data: { userId: session?.sub, action: 'LAB_CREATED', details: `lab=${lab.id}` } });

  return NextResponse.json({ ok: true, laboratory: lab }, { status: 201 });
}
