import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Seed a master resume entry if none exists
  const masterResume = await prisma.resume.findFirst({
    where: { isMaster: true },
  });

  if (!masterResume) {
    await prisma.resume.create({
      data: {
        name: 'Master Resume',
        content: '# Master Resume\n\n- Experience: Software Engineer...',
        isMaster: true,
      },
    });
    console.log('✅ Created default master resume.');
  } else {
    console.log('ℹ️ Master resume already exists.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
