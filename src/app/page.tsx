import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  redirect(session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
}
