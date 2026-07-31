import { PracticeSessionClient } from '@/components/practice-session-client';

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ subtopic: string }>;
}) {
  const { subtopic } = await params;
  const decodedSubtopic = decodeURIComponent(subtopic);

  return <PracticeSessionClient subtopic={decodedSubtopic} />;
}
