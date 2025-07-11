'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Insumo, columns } from './columns';
import { DataTable } from '@/components/data-table/data-table';

export default function InsumosPage() {
  const [data, setData] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);

  // Lógica de busca... (mantida)
  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setData(await response.json());
      } else {
        toast.error("Falha ao buscar insumos.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao buscar insumos.");
      console.error("Ocorreu um erro ao buscar insumos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Insumos</h1>
          <p className="text-gray-600">Adicione, edite ou remova os insumos do seu negócio.</p>
        </div>
        <Link href="/insumos/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Insumo
          </Button>
        </Link>
      </div>

      {loading ? (
        <p>Carregando insumos...</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
} 