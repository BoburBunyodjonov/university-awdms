// Idempotent seed: creates or refreshes the initial admin account.
// Password and email are configurable via env. Defaults exist so a developer
// can bootstrap a fresh DB in one command, but they MUST be changed for any
// shared environment.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.INITIAL_ADMIN_EMAIL ??
    process.env.SEED_ADMIN_EMAIL ??
    'admin@awdms.local'
  ).toLowerCase();
  const password =
    process.env.INITIAL_ADMIN_PASSWORD ??
    process.env.SEED_ADMIN_PASSWORD ??
    'Admin123!';
  const fullName =
    process.env.INITIAL_ADMIN_NAME ??
    process.env.SEED_ADMIN_NAME ??
    'System Administrator';
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(password, rounds);

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName,
      role: 'admin',
      passwordHash,
      isActive: true,
    },
    update: {
      passwordHash,
      fullName,
      role: 'admin',
      isActive: true,
    },
  });

  const usingDefault =
    !(process.env.INITIAL_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL) ||
    !(process.env.INITIAL_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD);

  console.log(`Seeded admin user: ${admin.email} (id=${admin.id})`);

  // Default active academic year so the workload module is usable on first run.
  // Idempotent: uses the `name` unique key.
  const yearName = '2026-2027';
  const academicYear = await prisma.academicYear.upsert({
    where: { name: yearName },
    create: {
      name: yearName,
      isActive: true,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-08-31'),
    },
    update: { isActive: true },
  });
  console.log(
    `Seeded academic year: ${academicYear.name} (id=${academicYear.id})`,
  );
  if (usingDefault) {
    console.warn(
      '⚠️  Using default admin credentials. Change SEED_ADMIN_EMAIL and ' +
        'SEED_ADMIN_PASSWORD in .env before using in any shared environment.',
    );
    console.log(`   email    : ${email}`);
    console.log(`   password : ${password}`);
  }

  // Default teacher user + linked Teacher profile so the teacher dashboard
  // is testable on first run. Idempotent.
  const teacherEmail =
    process.env.INITIAL_TEACHER_EMAIL?.toLowerCase() ?? 'teacher@awdms.uz';
  const teacherPassword =
    process.env.INITIAL_TEACHER_PASSWORD ?? 'TeacherPass2026!';
  const teacherFullName =
    process.env.INITIAL_TEACHER_NAME ?? 'Prof. Demo Teacher';

  const existingTeacherUser = await prisma.user.findUnique({
    where: { email: teacherEmail },
  });
  let teacherProfile;
  if (existingTeacherUser?.teacherId) {
    teacherProfile = await prisma.teacher.update({
      where: { id: existingTeacherUser.teacherId },
      data: { fullName: teacherFullName, isActive: true },
    });
  } else {
    teacherProfile = await prisma.teacher.create({
      data: {
        fullName: teacherFullName,
        degreeName: 'PhD in Computer Science',
        hasScientificDegree: true,
        position: 'Associate professor',
        annualNorm: 850,
        isActive: true,
      },
    });
  }

  const teacherHash = await bcrypt.hash(teacherPassword, rounds);
  const teacherUser = await prisma.user.upsert({
    where: { email: teacherEmail },
    create: {
      email: teacherEmail,
      fullName: teacherFullName,
      role: 'teacher',
      passwordHash: teacherHash,
      isActive: true,
      teacherId: teacherProfile.id,
    },
    update: {
      passwordHash: teacherHash,
      fullName: teacherFullName,
      role: 'teacher',
      isActive: true,
      teacherId: teacherProfile.id,
    },
  });

  const usingTeacherDefault =
    !process.env.INITIAL_TEACHER_EMAIL ||
    !process.env.INITIAL_TEACHER_PASSWORD;

  console.log(
    `Seeded teacher user: ${teacherUser.email} (teacherId=${teacherProfile.id})`,
  );
  if (usingTeacherDefault) {
    console.warn(
      '⚠️  Default teacher credentials in use. Override with ' +
        'INITIAL_TEACHER_EMAIL / INITIAL_TEACHER_PASSWORD in .env.',
    );
    console.log(`   email    : ${teacherEmail}`);
    console.log(`   password : ${teacherPassword}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
