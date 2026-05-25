'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustoIndiretoForm from '../../../../configuracoes/custos-indiretos/custo-indireto-form';
import { custosIndiretosApi } from '@/lib/api-client';

export default function EditarCustoIndiretoCTPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [registro, setRegistro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = await custosIndiretosApi.getById(id, token);
        setRegistro(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (!registro) return <div>Registro nÃ£o encontrado.</div>;

  return <CustoIndiretoForm custoIndireto={registro} />;
}


