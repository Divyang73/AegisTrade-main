import { SystemStateDashboard } from '@/components/system-state-dashboard';
import { HomeOverview } from '@/components/home-overview';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <SystemStateDashboard />
      <HomeOverview />
    </div>
  );
}
