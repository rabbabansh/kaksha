const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/**/*.ts');
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('prisma.user.findFirst()')) {
    content = content.replace(/prisma\.user\.findFirst\(\)/g, "prisma.user.findFirst({ orderBy: { questionAttempts: { _count: 'desc' } } })");
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    count++;
  }
}
console.log('Total files updated:', count);
