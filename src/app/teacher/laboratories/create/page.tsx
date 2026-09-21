import { prisma } from '@/lib/db';
import LaboratoryForm from '../LaboratoryForm';

export default async function CreateLaboratoryPage() {
  const students = await prisma.studentProfile.findMany({
    where: { deletedAt: null },
    orderBy: { lastName: 'asc' }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Yangi laboratoriya</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Laboratoriya ma'lumotlarini kiriting va talabalarni biriktiring</p>
      </div>
      <LaboratoryForm students={students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName} (${s.group})` }))} />
    </div>
  );
}
