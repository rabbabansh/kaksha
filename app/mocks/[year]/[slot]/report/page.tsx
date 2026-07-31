import { MockReportClient } from '@/components/mock-report-client';

export default async function MockReportPage({ params }: { params: Promise<{ year: string, slot: string }> }) {
  const resolvedParams = await params;
  return <MockReportClient year={resolvedParams.year} slot={resolvedParams.slot} />;
}
