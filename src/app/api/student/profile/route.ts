import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Yangi parol kamida 6 belgidan iborat bo'lsin")
});

export async function PATCH(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: 'Topilmadi.' }, { status: 404 });

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Joriy parol noto'g'ri." }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });

  return NextResponse.json({ ok: true });
}
