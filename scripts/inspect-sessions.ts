import prisma from '../lib/prisma';
async function main() {
  const sessions = await prisma.session.findMany({
    where: { userId: 'cmhph5juc0000ojip18s5q667' }
  });
  console.log(JSON.stringify(sessions, null, 2));
}
main();
