import { Suspense } from 'react';
import { AdminInvitationAcceptance } from '@/components/gestao/AdminInvitationAcceptance';

export default function AcceptAdminInvitationPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={null}>
        <AdminInvitationAcceptance />
      </Suspense>
    </main>
  );
}

