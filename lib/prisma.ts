import { PrismaClient } from './generated/prisma';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  cachedSyllabus?: Array<{ section: string | null; topic: string | null; subtopic: string | null }>;
};

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getSyllabus() {
  if (globalForPrisma.cachedSyllabus) {
    return globalForPrisma.cachedSyllabus;
  }
  const syllabus = await prisma.questions.findMany({
    select: { section: true, topic: true, subtopic: true },
    distinct: ['section', 'topic', 'subtopic']
  });
  globalForPrisma.cachedSyllabus = syllabus;
  return syllabus;
}

export default prisma;