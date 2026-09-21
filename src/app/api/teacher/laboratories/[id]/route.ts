import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createLaboratorySchema } from '@/lib/validation';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lab = await prisma.laboratory.findUnique({
    where: { id: params.id },
    include: {
      assignments: { include: { student: true } },
      submissions: { include: { student: true, review: true } }
    }
  });
  if (!lab) return NextResponse.json({ error: 'Laboratoriya topilmadi.' }, { status: 404 });
  return NextResponse.json({ laboratory: lab });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = createLaboratorySchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ma'lumotlar noto'g'ri." }, { status: 400 });

  const { studentIds, ...data } = parsed.data;

  const lab = await prisma.laboratory.update({ where: { id: params.id }, data });

  if (studentIds) {
    const existing = await prisma.laboratoryAssignment.findMany({ where: { laboratoryId: params.id } });
    const existingIds = new Set(existing.map((a) => a.studentId));
    const toAdd = studentIds.filter((id) => !existingIds.has(id));
    if (toAdd.length) {
      await prisma.laboratoryAssignment.createMany({
        data: toAdd.map((studentId) => ({ laboratoryId: params.id, studentId })),
        skipDuplicates: true
      });
    }
  }

  return NextResponse.json({ ok: true, laboratory: lab });
}

/** Haqiqiy o'chirish emas — arxivlash (soft delete), tarixiy submissionlar saqlanib qoladi. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.laboratory.update({ where: { id: params.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
  return NextResponse.json({ ok: true });
}
