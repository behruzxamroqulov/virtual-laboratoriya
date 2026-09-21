import { prisma } from '@/lib/db';
import StudentsTable from './StudentsTable';

export default async function StudentsPage() {
  const students = await prisma.studentProfile.findMany({
    where: { deletedAt: null },
    include: { user: { select: { login: true, active: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const serializable = students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    group: s.group,
    studentId: s.studentId,
    login: s.user.login,
    active: s.user.active
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Talabalar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Talabalarni yaratish, tahrirlash va boshqarish</p>
      </div>
      <StudentsTable initialStudents={serializable} />
    </div>
  );
}
