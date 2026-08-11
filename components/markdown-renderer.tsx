import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Prepend slash to relative questions_media paths so they resolve absolutely from server root
  let formattedContent = content
    ? content
        .replace(/(src=["'])questions_media\//g, '$1/questions_media/')
        .replace(/(src=["'])\.\.\/questions_media\//g, '$1/questions_media/')
    : '';

  if (formattedContent) {
    // Strip out scraped Google Ad blocks that contain hardcoded widths (e.g. 1010px) causing horizontal scroll
    formattedContent = formattedContent
      .replace(/<div[^>]*class="[^"]*google-auto-placed[^"]*"[^>]*>[\s\S]*?<\/div>/g, '')
      .replace(/<ins[^>]*class="[^"]*adsbygoogle[^"]*"[^>]*>[\s\S]*?<\/ins>/g, '');
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert prose-img:dark:invert prose-img:rounded-xl prose-img:shadow-sm max-w-none text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}
