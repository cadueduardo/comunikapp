'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import {
  ClipboardList,
  Edit,
  ArrowRight,
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { OrdemServico } from '../columns';

interface OSDetalhada extends OrdemServico {
  movimentacoes?: Array<{
    id: string;
    etapa_anterior?: string;
    etapa_atual: string;
    usuario_id: string;
    data_movimentacao: string;
    observacoes?: string;
  }>;
  checklists?: Array<{
    id: string;
    etapa: string;
    item_checklist: string;
    concluido: boolean;
    data_conclusao?: string;
  }>;
  parametros_tecnicos?: {
    largura?: number;
    altura?: number;
    area?: number;
    unidade_medida?: string;
    [key: string]: any;
  };
}

// Configuração de status (reutilizando)
const getStatusConfig = (status: string) => {
  const configs = {
    'FILA': { variant: 'secondary' as const, label: 'Na Fila', color: 'bg-gray-100 text-gray-800' },
    'PRODUCAO': { variant: 'default' as const, label: 'Em Produção', color: 'bg-blue-100 text-blue-800' },
    'ACABAMENTO': { variant: 'outline' as const, label: 'Acabamento', color: 'bg-yellow-100 text-yellow-800' },
    'FINALIZADA': { variant: 'default' as const, label: 'Finalizada', color: 'bg-green-100 text-green-800' },
    'CANCELADA': { variant: 'destructive' as const, label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    'AGUARDANDO_MATERIAL': { variant: 'outline' as const, label: 'Aguardando Material', color: 'bg-orange-100 text-orange-800' },
    'PAUSADA': { variant: 'secondary' as const, label: 'Pausada', color: 'bg-purple-100 text-purple-800' },
  };
  return configs[status] || { variant: 'outline' as const, label: status, color: 'bg-gray-100 text-gray-800' };
};

export default function OSDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [os, setOS] = useState<OSDetalhada | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOS();
    }
  }, [params.id]);

  const fetchOS = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/os/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOS(data.data);
        } else {
          throw new Error(data.message || 'Erro ao carregar OS');
        }
      } else {
        throw new Error('OS não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar ordem de serviço');
      router.push('/os');
    } finally {
      setLoading(false);
    }
  };

  const handleAvancarEtapa = async (novaEtapa: string) => {
    try {
      const response = await apiRequest(`/api/os/${params.id}/avancar-etapa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nova_etapa: novaEtapa,
          observacoes: `Etapa avançada para ${novaEtapa}`,
        }),
      });

      if (response.ok) {
        toast.success(`Etapa avançada para ${novaEtapa}`);
        fetchOS(); // Recarregar dados
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao avançar etapa');
      }
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao avançar etapa');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ordem de serviço...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Ordem de serviço não encontrada</p>
          <Link href="/os">
            <Button className="mt-4" variant="outline">
              Voltar para lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(os.status);
  const dataPrazo = os.data_prazo ? new Date(os.data_prazo) : null;
  const hoje = new Date();
  const isAtrasada = dataPrazo && dataPrazo < hoje;
  const isVencendo = dataPrazo && dataPrazo <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
  const podeEditar = os.status !== 'FINALIZADA' && os.status !== 'CANCELADA';

  // Próximas etapas possíveis (simplificado)
  const proximasEtapas = {
    'FILA': ['PRODUCAO'],
    'PRODUCAO': ['ACABAMENTO'],
    'ACABAMENTO': ['FINALIZADA'],
    'PAUSADA': ['FILA', 'PRODUCAO', 'ACABAMENTO'],
    'AGUARDANDO_MATERIAL': ['FILA', 'PRODUCAO'],
  };

  const etapasDisponiveis = proximasEtapas[os.status] || [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`OS #${os.numero}`}
        backHref="/os"
        icon={<ClipboardList className="h-8 w-8" />}
        subtitle={os.nome_servico}
        actions={
          podeEditar && (
            <Link href={`/os/${os.id}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar OS
              </Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantidade</label>
                  <div className="mt-1 font-medium">{os.quantidade}</div>
                </div>
              </div>

              {os.parametros_tecnicos && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Dimensões</label>
                  <div className="mt-1">
                    {os.parametros_tecnicos.largura && os.parametros_tecnicos.altura ? (
                      <span>
                        {os.parametros_tecnicos.largura} x {os.parametros_tecnicos.altura}
                        {os.parametros_tecnicos.unidade_medida && ` ${os.parametros_tecnicos.unidade_medida}`}
                        {os.parametros_tecnicos.area && ` (${os.parametros_tecnicos.area}m²)`}
                      </span>
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </div>
                </div>
              )}

              {os.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <div className="mt-1 text-gray-700">{os.descricao}</div>
                </div>
              )}

              {os.observacoes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Observações</label>
                  <div className="mt-1 text-gray-700">{os.observacoes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de movimentações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {os.movimentacoes && os.movimentacoes.length > 0 ? (
                <div className="space-y-3">
                  {os.movimentacoes.map((mov, index) => (
                    <div key={mov.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mov.etapa_atual}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(mov.data_movimentacao).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {mov.observacoes && (
                          <p className="text-sm text-gray-600 mt-1">{mov.observacoes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma movimentação registrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações de prazo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prazos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Abertura</label>
                <div className="mt-1">
                  {new Date(os.criado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {dataPrazo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Data Limite</label>
                  <div className={`mt-1 flex items-center gap-2 ${isAtrasada ? 'text-red-600 font-medium' : isVencendo ? 'text-yellow-600' : 'text-gray-700'}`}>                                                                                                                                            
                    <span>{dataPrazo.toLocaleDateString('pt-BR')}</span>
                    {isAtrasada && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {isVencendo && !isAtrasada && <Clock className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status dos materiais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {os.materiais_disponivel ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-medium">Materiais Disponíveis</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-600 font-medium">Verificar Disponibilidade</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações de workflow */}
          {podeEditar && etapasDisponiveis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Avançar Etapa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {etapasDisponiveis.map((etapa) => {
                  const etapaConfig = getStatusConfig(etapa);
                  return (
                    <Button
                      key={etapa}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAvancarEtapa(etapa)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Avançar para {etapaConfig.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Informações do responsável */}
          {os.responsavel_nome && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700">{os.responsavel_nome}</div>
              </CardContent>
            </Card>
          )}

          {/* Link para orçamento */}
          {os.orcamento_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/orcamentos/${os.orcamento_id}`}>
                  <Button variant="outline" className="w-full">
                    Ver Orçamento Original
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
