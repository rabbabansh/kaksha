const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const user = users[0];
  console.log("User:", user.email);

  const attempts = await prisma.questionAttempt.findMany({
    where: { userId: user.id },
    include: { question: { select: { topic: true, subtopic: true } } }
  });
  console.log("Question Attempts count:", attempts.length);

  const sessions = await prisma.session.findMany({
    where: { userId: user.id }
  });
  console.log("Sessions count:", sessions.length);
  
  if (sessions.length > 0) {
      console.log("Sample session:", sessions[0].type, sessions[0].year, sessions[0].slot);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
