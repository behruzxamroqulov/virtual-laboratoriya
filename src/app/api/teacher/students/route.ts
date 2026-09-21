import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createStudentSchema } from '@/lib/validation';
import { getCurrentSession } from '@/lib/session';

export async function GET() {
  const students = await prisma.studentProfile.findMany({
    where: { deletedAt: null },
    include: { user: { select: { login: true, active: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  const body = await req.json().catch(() => null);
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Ma'lumotlar noto'g'ri." }, { status: 400 });
  }
  const { firstName, lastName, login, password, group, studentId } = parsed.data;

  const existingLogin = await prisma.user.findUnique({ where: { login } });
  if (existingLogin) {
    return NextResponse.json({ error: 'Bu login band. Boshqa login tanlang.' }, { status: 409 });
  }
  const existingStudentId = await prisma.studentProfile.findUnique({ where: { studentId } });
  if (existingStudentId) {
    return NextResponse.json({ error: 'Bu Talaba ID band.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const student = await prisma.user.create({
    data: {
      login,
      passwordHash,
      role: 'STUDENT',
      studentProfile: { create: { firstName, lastName, group, studentId } }
    },
    include: { studentProfile: true }
  });

  await prisma.auditLog.create({ data: { userId: session?.sub, action: 'STUDENT_CREATED', details: `login=${login}` } });

  return NextResponse.json({ ok: true, student }, { status: 201 });
}
