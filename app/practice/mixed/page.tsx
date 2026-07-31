import { MixedSessionClient } from '@/components/mixed-session-client';

export default async function MixedSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return <MixedSessionClient topic={topic} />;
}
