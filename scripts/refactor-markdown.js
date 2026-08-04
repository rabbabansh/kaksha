const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') && f !== 'markdown-renderer.tsx');

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('ReactMarkdown')) {
    // Replace imports
    content = content.replace(/import ReactMarkdown from 'react-markdown';\n?/g, '');
    content = content.replace(/import remarkMath from 'remark-math';\n?/g, '');
    content = content.replace(/import rehypeKatex from 'rehype-katex';\n?/g, '');
    content = content.replace(/import rehypeRaw from 'rehype-raw';\n?/g, '');
    content = content.replace(/import 'katex\/dist\/katex\.min\.css';\n?/g, '');
    
    // Add MarkdownRenderer import
    if (!content.includes('MarkdownRenderer')) {
      content = content.replace(/import .*? from '.*?';\n/, match => match + "import { MarkdownRenderer } from '@/components/markdown-renderer';\n");
    }

    // Replace basic tags
    content = content.replace(/<ReactMarkdown[^>]*>([\s\S]*?)<\/ReactMarkdown>/g, (match, inner) => {
      // If inner is just a variable or string
      inner = inner.trim();
      // If it's a JSX expression like {explanation[qId]}
      if (inner.startsWith('{') && inner.endsWith('}')) {
         const exp = inner.slice(1, -1);
         return `<MarkdownRenderer content={${exp}} />`;
      }
      return `<MarkdownRenderer content={${inner}} />`;
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Refactored ${file}`);
  }
}
