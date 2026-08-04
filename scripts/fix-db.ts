import prisma from '../lib/prisma';
async function main() {
  const sessions = await prisma.session.findMany();
  console.log("Total sessions:", sessions.length);
  if (sessions.length > 0) {
    const counts = sessions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});
    console.log("Session types:", counts);
    console.log("Sample MOCK session with null year:", sessions.find(s => s.type === 'MOCK' && !s.year));
  }
}
main();
