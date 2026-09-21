import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/api/teacher/:path*', '/api/student/:path*']
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const { pathname } = req.nextUrl;

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Tizimga kirish talab qilinadi.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isTeacherRoute = pathname.startsWith('/teacher') || pathname.startsWith('/api/teacher');
  const isStudentRoute = pathname.startsWith('/student') || pathname.startsWith('/api/student');

  if (isTeacherRoute && session.role !== 'TEACHER') {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 })
      : NextResponse.redirect(new URL('/student/dashboard', req.url));
  }

  if (isStudentRoute && session.role !== 'STUDENT') {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: "Ruxsat yo'q." }, { status: 403 })
      : NextResponse.redirect(new URL('/teacher/dashboard', req.url));
  }

  return NextResponse.next();
}
