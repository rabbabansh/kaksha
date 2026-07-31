import { ReviewSessionClient } from '@/components/review-session-client';

export default async function ReviewPage({ params }: { params: Promise<{ subtopic: string }> }) {
  const resolvedParams = await params;
  return <ReviewSessionClient subtopic={decodeURIComponent(resolvedParams.subtopic)} />;
}
