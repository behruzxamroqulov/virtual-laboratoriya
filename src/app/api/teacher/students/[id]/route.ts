import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { updateStudentSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ma'lumotlar noto'g'ri." }, { status: 400 });
  }

  const student = await prisma.studentProfile.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ error: 'Talaba topilmadi.' }, { status: 404 });

  const { firstName, lastName, group, active, password } = parsed.data;

  await prisma.studentProfile.update({
    where: { id: params.id },
    data: { firstName, lastName, group }
  });

  if (typeof active === 'boolean' || password) {
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(password ? { passwordHash: await hashPassword(password) } : {})
      }
    });
  }

  return NextResponse.json({ ok: true });
}

/** Talaba "o'chirilganda" haqiqiy DELETE emas, soft-delete + deaktivatsiya qilinadi. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const student = await prisma.studentProfile.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ error: 'Talaba topilmadi.' }, { status: 404 });

  await prisma.$transaction([
    prisma.studentProfile.update({ where: { id: params.id }, data: { deletedAt: new Date() } }),
    prisma.user.update({ where: { id: student.userId }, data: { active: false } })
  ]);

  return NextResponse.json({ ok: true });
}
