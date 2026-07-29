import { ReactNode } from 'react';
import { AdminShell } from '@/components/gestao/AdminShell';

export default function GestaoDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

