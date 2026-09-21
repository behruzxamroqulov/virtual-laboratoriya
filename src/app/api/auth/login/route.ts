import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, verifyPassword, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Brute-force himoyasi: bir IP uchun 15 daqiqada maksimal 10 urinish
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. Iltimos, birozdan so'ng qayta urinib ko'ring." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Login yoki parol noto'g'ri formatda." }, { status: 400 });
  }

  const { login, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { login } });

  // Foydalanuvchi topilmasa ham, doim bcrypt.compare bajaramiz — bu orqali
  // "login mavjud/mavjud emas" farqini timing hujumi bilan bilib olishning oldini olamiz.
  const dummyHash = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8YB.aXtSw.3ZbldyLwHTfr3IF3LG3q';
  const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, dummyHash);

  if (!user || !ok || !user.active) {
    await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED', details: `login=${login}`, ip } }).catch(() => {});
    return NextResponse.json({ error: "Login yoki parol noto'g'ri." }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, role: user.role, login: user.login });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirect: user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });

  await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_SUCCESS', ip } }).catch(() => {});

  return res;
}
