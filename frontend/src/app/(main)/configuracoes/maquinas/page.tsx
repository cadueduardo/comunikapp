'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  status: string;
  capacidade?: string;
  observacoes?: string;
  criado_em: string;
}

const tipoLabels = {
  PLOTTER: 'Plotter',
  ROUTER: 'Router',
  IMPRESSORA: 'Impressora',
  CORTE: 'Corte',
  OUTROS: 'Outros',
};

const statusLabels = {
  ATIVA: 'Ativa',
  MANUTENCAO: 'Manutenção',
  INATIVA: 'Inativa',
};

const statusColors = {
  ATIVA: 'bg-green-100 text-green-800',
  MANUTENCAO: 'bg-yellow-100 text-yellow-800',
  INATIVA: 'bg-red-100 text-red-800',
};

export default function MaquinasPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/maquinas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      } else {
        toast.error('Erro ao carregar máquinas');
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
      toast.error('Erro ao carregar máquinas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a máquina "${nome}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/maquinas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Máquina excluída com sucesso!');
        fetchMaquinas();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao excluir máquina');
      }
    } catch (error) {
      console.error('Erro ao excluir máquina:', error);
      toast.error('Erro ao excluir máquina');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Máquinas</h1>
          <p className="text-muted-foreground">
            Gerencie as máquinas da sua loja e seus custos operacionais.
          </p>
        </div>
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Máquinas</h1>
            <p className="text-muted-foreground">
              Gerencie as máquinas da sua loja e seus custos operacionais.
            </p>
          </div>
          <Link href="/configuracoes/maquinas/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Máquina
            </Button>
          </Link>
        </div>
      </div>

      {maquinas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhuma máquina cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando sua primeira máquina para calcular custos operacionais.
              </p>
              <Link href="/configuracoes/maquinas/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Máquina
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {maquinas.map((maquina) => (
            <Card key={maquina.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{maquina.nome}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href={`/configuracoes/maquinas/editar/${maquina.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(maquina.id, maquina.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <Badge variant="outline">{tipoLabels[maquina.tipo as keyof typeof tipoLabels]}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={statusColors[maquina.status as keyof typeof statusColors]}>
                      {statusLabels[maquina.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Custo/Hora:</span>
                    <span className="font-medium">
                      R$ {maquina.custo_hora.toFixed(2)}
                    </span>
                  </div>
                  
                  {maquina.capacidade && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Capacidade:</span>
                      <span className="text-sm">{maquina.capacidade}</span>
                    </div>
                  )}
                  
                  {maquina.observacoes && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Observações:</span>
                      <p className="text-sm mt-1">{maquina.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 