import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { DailySetClient } from '@/components/daily-set-client';
import { authOptions } from '@/lib/auth';

export default async function DailySetPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { type } = await params;
  const normalizedType = type.toUpperCase() === 'DILR' ? 'DILR' : 'RC';

  return <DailySetClient type={normalizedType} />;
}
