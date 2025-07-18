'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { toast } from 'sonner';
import { Plus, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CustoIndireto {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  observacoes?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export default function CustosIndiretosPage() {
  const [custosIndiretos, setCustosIndiretos] = useState<CustoIndireto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustosIndiretos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const response = await fetch('http://localhost:3001/custos-indiretos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar custos indiretos');
      }

      const data = await response.json();
      setCustosIndiretos(data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar custos indiretos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustosIndiretos();
  }, []);



  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Custos Indiretos</h1>
          <p className="text-muted-foreground">
            Gerencie os custos indiretos da sua empresa
          </p>
        </div>
        <Link href="/configuracoes/custos-indiretos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Custo Indireto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Custos Indiretos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={custosIndiretos}
          />
        </CardContent>
      </Card>
    </div>
  );
} 