import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import ResourceMonitor from '@/components/ResourceMonitor';
import { LayoutDashboard, Users, FlaskConical, ClipboardList, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/students', label: 'Talabalar', icon: Users },
  { href: '/teacher/laboratories', label: 'Laboratoriyalar', icon: FlaskConical },
  { href: '/teacher/submissions', label: 'Topshiriqlar', icon: ClipboardList },
  { href: '/teacher/monitoring', label: 'Monitoring', icon: Activity }
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'TEACHER') redirect('/login');

  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: session.sub } });
  const userName = teacher ? `${teacher.firstName} ${teacher.lastName}` : session.login;

  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} userName={userName} roleLabel="Ustoz paneli" />
      <div className="flex-1">
        <div className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <ResourceMonitor variant="compact" />
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
