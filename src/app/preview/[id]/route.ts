import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { buildSandboxDocument } from '@/lib/sandboxBundler';

/**
 * Bu endpoint talaba/ustoz brauzerida <iframe sandbox="allow-scripts" srcdoc="...">
 * orqali ko'rsatiladigan xavfsiz preview sahifasini beradi. next.config.js'dagi
 * "/preview/:path*" uchun alohida qattiq Content-Security-Policy shu yerga
 * qo'llanadi. allow-same-origin berilmagani uchun bu javob asosiy platforma
 * bilan bir xil originda bo'lsa ham, iframe ichidan cookie/localStorage'ga
 * kirish imkonsiz (iframe har doim null originda ishlaydi).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return new Response('Ruxsat yo\'q', { status: 401 });

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      webProject: { include: { files: true } },
      laboratory: true,
      student: true
    }
  });

  if (!submission) return new Response('Topshiriq topilmadi', { status: 404 });

  const isOwner = session.role === 'STUDENT' && submission.student.userId === session.sub;
  const isTeacherOwner = session.role === 'TEACHER';
  if (!isOwner && !isTeacherOwner) {
    return new Response('Ruxsat yo\'q', { status: 403 });
  }
  if (isTeacherOwner) {
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session.sub } });
    if (!teacher || teacher.id !== submission.laboratory.teacherId) {
      return new Response('Ruxsat yo\'q', { status: 403 });
    }
  }

  if (!submission.webProject || submission.webProject.files.length === 0) {
    return new Response('<!doctype html><body style="font-family:sans-serif;padding:24px;color:#64748b">Hali fayl yuklanmagan.</body>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const html = await buildSandboxDocument(
    submission.webProject.files.map((f) => ({ fileName: f.fileName, url: f.url, mimeType: f.mimeType }))
  );

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
