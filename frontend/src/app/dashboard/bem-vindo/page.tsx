'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

export default function BemVindoPage() {
  const router = useRouter();

  const handleNavigateToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl text-center">
        
        <div className="flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
                <PartyPopper className="h-12 w-12 text-green-600" />
            </div>
        </div>
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">Tudo pronto!</h1>
            <p className="text-muted-foreground text-lg">
                Sua conta foi verificada com sucesso.
            </p>
        </div>

        <p className="text-gray-600">
            Estamos felizes em ter você a bordo. Você está a um passo de simplificar a gestão e os orçamentos da sua empresa de comunicação visual.
        </p>

        <Button 
            onClick={handleNavigateToDashboard} 
            className="w-full"
            size="lg"
        >
            Começar a usar
        </Button>
      </div>
    </div>
  );
} 