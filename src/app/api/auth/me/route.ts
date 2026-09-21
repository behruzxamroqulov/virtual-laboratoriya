import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { teacherProfile: true, studentProfile: true }
  });

  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: {
      id: user.id,
      login: user.login,
      role: user.role,
      name:
        user.role === 'TEACHER'
          ? `${user.teacherProfile?.firstName} ${user.teacherProfile?.lastName}`
          : `${user.studentProfile?.firstName} ${user.studentProfile?.lastName}`
    }
  });
}
