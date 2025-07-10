'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface TrialInfo {
  trial_days_left: number | null;
  trial_status: 'active' | 'expired';
  trial_ends_at: string | null;
}

export const TrialBanner = () => {
  const { user } = useUser();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialInfo = async () => {
      if (!user?.loja_id) return;

      try {
        const response = await fetch(`http://localhost:3001/lojas/loja-trial/${user.loja_id}`);
        if (response.ok) {
          const data = await response.json();
          setTrialInfo(data);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do trial:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialInfo();
  }, [user?.loja_id]);

  if (loading || !trialInfo || trialInfo.trial_days_left === null) {
    return null;
  }

  const { trial_days_left, trial_status } = trialInfo;

  if (trial_status === 'expired') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Período de teste expirado
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Seu período de teste gratuito terminou. Assine um plano para continuar usando o Comunikapp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (trial_days_left <= 7) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              {trial_days_left === 0 
                ? 'Último dia do período de teste' 
                : `${trial_days_left} dias restantes no período de teste`}
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Escolha um plano para continuar aproveitando todos os recursos do Comunikapp.
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
            Você tem {trial_days_left} dias para explorar todos os recursos gratuitamente.
          </p>
        </div>
      </div>
    </div>
  );
}; 