'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TipoMaterialForm } from '../../tipo-material-form';
import { TipoMaterial } from '../../columns';
import { toast } from 'sonner';

export default function EditarTipoMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipoMaterial = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:3001/tipos-material/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTipoMaterial(data);
        } else {
          toast.error('Tipo de material não encontrado');
          router.push('/configuracoes/tipos-material');
        }
      } catch (error) {
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