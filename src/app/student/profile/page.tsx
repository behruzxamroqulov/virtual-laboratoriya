import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import ProfileForm from './ProfileForm';

export default async function StudentProfilePage() {
  const session = await getCurrentSession();
  const student = await prisma.studentProfile.findUnique({
    where: { userId: session!.sub },
    include: { user: { select: { login: true } } }
  });
  if (!student) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Shaxsiy ma'lumotlar va parolni almashtirish</p>
      </div>

      <div className="card space-y-2 p-6 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Ism Familiya</span><span className="font-medium">{student.firstName} {student.lastName}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Login</span><span className="font-medium">{student.user.login}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Guruh</span><span className="font-medium">{student.group}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Talaba ID</span><span className="font-medium">{student.studentId}</span></div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold">Parolni almashtirish</h3>
        <ProfileForm />
      </div>
    </div>
  );
}
