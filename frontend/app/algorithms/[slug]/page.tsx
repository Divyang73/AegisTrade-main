import { notFound } from 'next/navigation';

import { StrategyDetailDashboard } from '@/components/strategy-detail-dashboard';
import { getStrategyContent } from '@/lib/strategy-content';

export default function StrategyPage({ params }: { params: { slug: string } }) {
  const content = getStrategyContent(params.slug);
  if (!content) {
    notFound();
  }

  return <StrategyDetailDashboard slug={params.slug} />;
}
