import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getApplications, getUsage } from '@/lib/api';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — AI Job Agent',
  description: 'Track your AI-powered job applications',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = (session.user as any).id as string;
  const plan = (session.user as any).plan as string;

  const [applications, usage] = await Promise.all([
    getApplications(userId),
    getUsage(userId),
  ]);

  return (
    <DashboardClient
      applications={applications}
      usage={usage}
      userName={session.user?.name ?? session.user?.email ?? 'there'}
      plan={plan}
    />
  );
}
