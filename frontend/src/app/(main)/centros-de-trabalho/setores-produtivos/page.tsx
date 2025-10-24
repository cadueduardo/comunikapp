'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  IconBuildingFactory, 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash,
  IconRefresh,
  IconUsers,
  IconSettings,
  IconClock
} from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SetorProdutivo {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export default function SetoresProdutivosPage() {
  const [setores, setSetores] = useState<SetorProdutivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSetores();
  }, []);

  const fetchSetores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      console.log('🔍 Fazendo request para:', '/api/centros-de-trabalho/setores-produtivos');
      console.log('🔍 Token encontrado:', !!token);
      
      const response = await fetch('/api/centros-de-trabalho/setores-produtivos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Dados recebidos:', data);
        setSetores(data);
      } else if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao buscar setores - Status:', response.status);
        console.error('❌ Erro ao buscar setores - Response:', errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar setores:', error);
      toast.error(error.message || 'Erro ao carregar setores produtivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/centros-de-trabalho/setores-produtivos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Setor excluído com sucesso');
        fetchSetores();
      } else {
        throw new Error('Erro ao excluir setor');
      }
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast.error('Erro ao excluir setor');
    }
  };

  const filteredSetores = setores.filter(setor =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setor.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Setores Produtivos</h1>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconBuildingFactory className="h-6 w-6" />
            Setores Produtivos
          </h1>
          <p className="text-gray-600">
            Gerencie os setores produtivos da sua empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSetores}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/centros-de-trabalho/setores-produtivos/novo">
              <IconPlus className="h-4 w-4 mr-2" />
              Novo Setor
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar setores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredSetores.length} setor(es)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Setores */}
      {filteredSetores.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <IconBuildingFactory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Nenhum setor encontrado' : 'Nenhum setor cadastrado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando seu primeiro setor produtivo'
              }
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/centros-de-trabalho/setores-produtivos/novo">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Setor
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSetores.map((setor) => (
            <Card key={setor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: setor.cor }}
                    />
                    {setor.nome}
                  </CardTitle>
                  <Badge variant={setor.ativo ? 'default' : 'secondary'}>
                    {setor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {setor.descricao && (
                  <CardDescription>{setor.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Informações do setor */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Ordem:</span>
                      <span className="font-medium">{setor.ordem}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Operadores:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/centros-de-trabalho/setores-produtivos/editar/${setor.id}`}>
                        <IconEdit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(setor.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
