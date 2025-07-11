'use client';

import { useUser } from '@/contexts/UserContext';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export const TrialBanner = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
       <Skeleton className="h-16 w-full" />
    );
  }

  // Se não há usuário ou dados da loja, não mostra nada.
  if (!user || !user.loja) {
    return null;
  }
  
  const { trial_restante_dias } = user.loja;

  // Se o trial não está definido (null) ou já expirou (menor ou igual a 0)
  if (trial_restante_dias === null || trial_restante_dias < 0) {
    // Poderíamos mostrar um banner de trial expirado aqui no futuro
    return null;
  }
  
    if (trial_restante_dias === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Último dia do período de teste
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Seu período de teste gratuito termina hoje. Assine um plano para não perder o acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (trial_restante_dias <= 7) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Período de teste terminando
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
             Você tem {trial_restante_dias} dias restantes. Escolha um plano para continuar aproveitando todos os recursos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-blue-800">
            Período de teste ativo
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Você tem {trial_restante_dias} dias para explorar todos os recursos gratuitamente.
          </p>
        </div>
      </div>
    </div>
  );
}; 