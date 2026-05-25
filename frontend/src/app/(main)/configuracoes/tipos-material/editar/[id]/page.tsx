'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TipoMaterialForm } from '../../tipo-material-form';
import { TipoMaterial } from '../../columns';
import { toast } from 'sonner';
import { tiposMaterialApi } from '@/lib/api-client';

export default function EditarTipoMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipoMaterial = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error("Token de acesso não encontrado.");
          router.push('/configuracoes/tipos-material');
          return;
        }

        const data = await tiposMaterialApi.getById(params.id as string, token);
        setTipoMaterial(data);
      } catch {
        toast.error('Erro ao carregar tipo de material');
        router.push('/configuracoes/tipos-material');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTipoMaterial();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!tipoMaterial) {
    return null;
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Tipo de Material</h1>
        <p className="text-gray-600">Altere as configurações do tipo de material.</p>
      </div>
      
      <TipoMaterialForm defaultValues={tipoMaterial} />
    </div>
  );
} 