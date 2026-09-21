import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import { LayoutDashboard, FlaskConical, ClipboardCheck, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/laboratories', label: 'Laboratoriyalar', icon: FlaskConical },
  { href: '/student/submissions', label: 'Topshiriqlarim', icon: ClipboardCheck },
  { href: '/student/profile', label: 'Profil', icon: User }
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'STUDENT') redirect('/login');

  const student = await prisma.studentProfile.findUnique({ where: { userId: session.sub } });
  const userName = student ? `${student.firstName} ${student.lastName}` : session.login;

  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} userName={userName} roleLabel="Talaba kabineti" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
