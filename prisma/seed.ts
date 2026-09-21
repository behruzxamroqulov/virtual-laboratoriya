import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const login = process.env.SEED_TEACHER_LOGIN || 'ustoz';
  const password = process.env.SEED_TEACHER_PASSWORD || 'ustoz1';

  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    console.log(`"${login}" login bilan foydalanuvchi allaqachon mavjud, seed o'tkazib yuborildi.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      login,
      passwordHash,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          firstName: 'Ustoz',
          lastName: 'Foydalanuvchi'
        }
      }
    }
  });

  console.log(`Boshlang'ich ustoz hisobi yaratildi: login="${login}"`);
  console.log('MUHIM: production muhitda birinchi kirishdan so\'ng parolni albatta almashtiring.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
