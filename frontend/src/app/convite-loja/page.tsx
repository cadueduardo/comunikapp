import { Suspense } from 'react';
import { StoreUserInvitationAcceptance } from '@/components/gestao/StoreUserInvitationAcceptance';

export default function ConviteLojaPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={null}>
        <StoreUserInvitationAcceptance />
      </Suspense>
    </main>
  );
}
