'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Insumo {
  id: string;
  nome: string;
  categoria: string;
  unidade_medida: string;
  custo_unitario: number;
  // Campos opcionais que podem ou não vir da API
  fornecedor?: string;
  codigo_interno?: string;
}

export default function InsumosPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInsumos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/insumos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
      toast.error('Não foi possível carregar os insumos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);
  
  // TODO: Implementar busca no backend
  const handleSearch = () => {
    toast.info("Funcionalidade de busca ainda não implementada.");
  };
  
  const handleDelete = async (insumoId: string) => {
    const promise = () => new Promise(async (resolve, reject) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          return reject(new Error('Sessão expirada. Faça login novamente.'));
        }

        const response = await fetch(`http://localhost:3001/insumos/${insumoId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          setInsumos(prevInsumos => prevInsumos.filter(i => i.id !== insumoId));
          resolve({ success: true });
        } else {
          const errorData = await response.json();
          reject(new Error(errorData.message || 'Não foi possível excluir o insumo.'));
        }
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise(), {
      loading: 'Excluindo insumo...',
      success: 'Insumo excluído com sucesso!',
      error: (err) => err.message || 'Ocorreu um erro ao excluir o insumo.',
    });
  };

  const confirmDelete = (insumoId: string) => {
    toast("Tem certeza que deseja excluir?", {
      action: {
        label: "Excluir",
        onClick: () => handleDelete(insumoId),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
      duration: 5000,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insumos</h1>
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${insumos.length} insumo${insumos.length !== 1 ? 's' : ''} cadastrado${insumos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/insumos/novo">
          <Button className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Novo Insumo
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nome, categoria, fornecedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 w-full"
        />
      </div>

      {/* Lista de Insumos */}
      {insumos.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
          <p className="mb-2">Nenhum insumo encontrado.</p>
          <Link href="/insumos/novo">
            <Button className="mt-4 cursor-pointer hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeiro insumo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {insumos.map((insumo) => (
            <Card key={insumo.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 relative">
                
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/insumos/editar/${insumo.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => confirmDelete(insumo.id)}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-lg truncate pr-8" title={insumo.nome}>
                      {insumo.nome}
                    </h3>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline">{insumo.categoria}</Badge>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <strong>Custo:</strong> {formatCurrency(insumo.custo_unitario)} / {insumo.unidade_medida}
                    </p>
                    {insumo.fornecedor && <p><strong>Fornecedor:</strong> {insumo.fornecedor}</p>}
                    {insumo.codigo_interno && <p><strong>Cód. Interno:</strong> {insumo.codigo_interno}</p>}
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