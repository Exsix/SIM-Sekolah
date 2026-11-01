import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <DashboardShell user={session}>{children}</DashboardShell>;
}
