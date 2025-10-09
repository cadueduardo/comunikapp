'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface RegraValidacao {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'VALIDACAO' | 'ALERTA' | 'CORRECAO' | 'APROVACAO';
  categoria: 'ESTOQUE' | 'ARTE' | 'DADOS' | 'PRAZO' | 'FINANCEIRO' | 'TECNICO' | 'COMERCIAL';
  ativo: boolean;
  prioridade: number;
  loja?: {
    nome: string;
  };
  _count: {
    execucoes: number;
  };
  criado_em: string;
  atualizado_em: string;
}

export default function RegrasValidacaoPage() {
  const [regras, setRegras] = useState<RegraValidacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; nome: string }>({
    open: false,
    id: null,
    nome: ''
  });

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/configuracoes/regras-validacao/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo })
      });
      
      // Recarregar lista
      setRegras(regras.map(r => r.id === id ? { ...r, ativo: !ativo } : r));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteClick = (id: string, nome: string) => {
    setDeleteDialog({ open: true, id, nome });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.id) return;

    try {
      await fetch(`/api/configuracoes/regras-validacao/${deleteDialog.id}`, {
        method: 'DELETE'
      });
      
      // Remover da lista
      setRegras(regras.filter(r => r.id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null, nome: '' });
    } catch (error) {
      console.error('Erro ao excluir regra:', error);
    }
  };

  useEffect(() => {
    const loadRegras = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append('busca', search);
        if (categoria) params.append('categoria', categoria);
        if (status) params.append('ativo', status === 'ativo' ? 'true' : 'false');

        const response = await fetch(`/api/configuracoes/regras-validacao?${params}`);
        const data = await response.json();
        setRegras(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar regras:', error);
        setRegras([]);
      } finally {
        setLoading(false);
      }
    };

    loadRegras();
  }, [search, categoria, status]);

  const getCategoriaInfo = (categoria: string) => {
    const categorias = {
      'ESTOQUE': { nome: 'Estoque', cor: 'bg-red-100 text-red-800', icone: '📦' },
      'ARTE': { nome: 'Arte', cor: 'bg-purple-100 text-purple-800', icone: '🎨' },
      'DADOS': { nome: 'Dados', cor: 'bg-blue-100 text-blue-800', icone: '📊' },
      'PRAZO': { nome: 'Prazo', cor: 'bg-yellow-100 text-yellow-800', icone: '⏰' },
      'TECNICO': { nome: 'Técnico', cor: 'bg-indigo-100 text-indigo-800', icone: '⚙️' },
      'COMERCIAL': { nome: 'Comercial', cor: 'bg-pink-100 text-pink-800', icone: '💼' },
      'FINANCEIRO': { nome: 'Financeiro', cor: 'bg-green-100 text-green-800', icone: '💰' }
    };
    return categorias[categoria as keyof typeof categorias] || { nome: categoria, cor: 'bg-gray-100 text-gray-800', icone: '❓' };
  };

  const getTipoInfo = (tipo: string) => {
    const tipos = {
      'VALIDACAO': { nome: 'Validação', cor: 'bg-blue-100 text-blue-800', icone: Shield },
      'ALERTA': { nome: 'Alerta', cor: 'bg-yellow-100 text-yellow-800', icone: AlertTriangle },
      'CORRECAO': { nome: 'Correção', cor: 'bg-orange-100 text-orange-800', icone: CheckCircle },
      'APROVACAO': { nome: 'Aprovação', cor: 'bg-green-100 text-green-800', icone: CheckCircle }
    };
    return tipos[tipo as keyof typeof tipos] || { nome: tipo, cor: 'bg-gray-100 text-gray-800', icone: Shield };
  };

  const columns = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          {row.original.descricao && (
            <div className="text-sm text-gray-500">{row.original.descricao}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }: any) => {
        const info = getCategoriaInfo(row.original.categoria);
        return (
          <Badge className={info.cor}>
            <span className="mr-1">{info.icone}</span>
            {info.nome}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: any) => {
        const info = getTipoInfo(row.original.tipo);
        const Icone = info.icone;
        return (
          <Badge className={info.cor}>
            <Icone className="h-3 w-3 mr-1" />
            {info.nome}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'prioridade',
      header: 'Prioridade',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{row.original.prioridade}</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(row.original.prioridade / 5) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'execucoes',
      header: 'Execuções',
      cell: ({ row }: any) => (
        <div className="text-center">
          <div className="font-medium">{row.original._count.execucoes}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/configuracoes/validacoes-automaticas/regras/${row.original.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Play className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regras de Validação</h1>
            <p className="text-gray-600">Gerencie as regras de validação automática</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regras de Validação</h1>
          <p className="text-gray-600">Gerencie as regras de validação automática</p>
        </div>
        <Button asChild>
          <Link href="/configuracoes/validacoes-automaticas/regras/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar regras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTOQUE">Estoque</SelectItem>
                <SelectItem value="ARTE">Arte</SelectItem>
                <SelectItem value="DADOS">Dados</SelectItem>
                <SelectItem value="PRAZO">Prazo</SelectItem>
                <SelectItem value="TECNICO">Técnico</SelectItem>
                <SelectItem value="COMERCIAL">Comercial</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Tabela
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela/Cards */}
      {regras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma regra encontrada</h3>
            <p className="text-gray-600 mb-4">Crie sua primeira regra de validação para começar</p>
            <Button asChild>
              <Link href="/configuracoes/validacoes-automaticas/regras/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Execuções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regras.map((regra) => {
                  const categoriaInfo = getCategoriaInfo(regra.categoria);
                  const tipoInfo = getTipoInfo(regra.tipo);
                  const TipoIcone = tipoInfo.icone;

                  return (
                    <TableRow key={regra.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{regra.nome}</div>
                          {regra.descricao && (
                            <div className="text-sm text-gray-500">{regra.descricao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={categoriaInfo.cor}>
                          <span className="mr-1">{categoriaInfo.icone}</span>
                          {categoriaInfo.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={tipoInfo.cor}>
                          <TipoIcone className="h-3 w-3 mr-1" />
                          {tipoInfo.nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={regra.ativo ? 'default' : 'secondary'}>
                          {regra.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{regra.prioridade}</TableCell>
                      <TableCell>{regra._count.execucoes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/configuracoes/validacoes-automaticas/regras/${regra.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleStatus(regra.id, regra.ativo)}
                            title={regra.ativo ? 'Desativar' : 'Ativar'}
                          >
                            <Power className={`h-4 w-4 ${regra.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(regra.id, regra.nome)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regras.map((regra) => {
            const categoriaInfo = getCategoriaInfo(regra.categoria);
            const tipoInfo = getTipoInfo(regra.tipo);
            const TipoIcone = tipoInfo.icone;
            
            return (
              <Card key={regra.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{regra.nome}</CardTitle>
                      {regra.descricao && (
                        <CardDescription>{regra.descricao}</CardDescription>
                      )}
                    </div>
                    <Badge variant={regra.ativo ? 'default' : 'secondary'}>
                      {regra.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={categoriaInfo.cor}>
                        <span className="mr-1">{categoriaInfo.icone}</span>
                        {categoriaInfo.nome}
                      </Badge>
                      <Badge className={tipoInfo.cor}>
                        <TipoIcone className="h-3 w-3 mr-1" />
                        {tipoInfo.nome}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Prioridade: {regra.prioridade}</span>
                      <span>{regra._count.execucoes} execuções</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <Link href={`/configuracoes/validacoes-automaticas/regras/${regra.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleStatus(regra.id, regra.ativo)}
                        title={regra.ativo ? 'Desativar' : 'Ativar'}
                      >
                        <Power className={`h-4 w-4 ${regra.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(regra.id, regra.nome)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, nome: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra de Validação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a regra <strong>&quot;{deleteDialog.nome}&quot;</strong>.
              <br /><br />
              Esta ação não pode ser desfeita e todas as execuções históricas desta regra serão mantidas apenas para referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
