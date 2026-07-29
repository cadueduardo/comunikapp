import { ReactNode } from 'react';
import { AdminProvider } from '@/contexts/AdminContext';

export default function GestaoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminProvider>{children}</AdminProvider>;
}

