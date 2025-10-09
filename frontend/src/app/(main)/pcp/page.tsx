'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IconBuilding, 
  IconClipboardList, 
  IconChartBar, 
  IconSettings,
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconClock
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface OSLiberada {
  id: string;
  numero: string;
  nome_servico: string;
  cliente?: {
    nome: string;
  };
  status: string;
  prioridade: string;
  data_prazo?: string;
  workflow_instanciado: boolean;
  workflow_status?: string;
  workflow_progresso?: number;
}

interface WorkflowInstancia {
  id: string;
  os_id: string;
  workflow_template_id: string;
  status: string;
  progresso: number;
  etapa_atual?: string;
  criado_em: string;
}

interface PCPStats {
  totalOSsLiberadas: number;
  workflowsAtivos: number;
  etapasPendentes: number;
  eficienciaMedia: number;
}

export default function PCPPage() {
  const [loading, setLoading] = useState(true);
  const [osLiberadas, setOSsLiberadas] = useState<OSLiberada[]>([]);
  const [workflowsAtivos, setWorkflowsAtivos] = useState<WorkflowInstancia[]>([]);
  const [stats, setStats] = useState<PCPStats>({
    totalOSsLiberadas: 0,
    workflowsAtivos: 0,
    etapasPendentes: 0,
    eficienciaMedia: 0
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOSsLiberadas(),
        fetchWorkflowsAtivos()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do PCP:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchOSsLiberadas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Token encontrado:', !!token);
      console.log('🔍 Fazendo request para:', '/api/os/liberadas-para-pcp');
      
      const response = await fetch('/api/os/liberadas-para-pcp', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Dados recebidos:', data);
        // Se não há dados, retornar array vazio (não é erro)
        const ossData = Array.isArray(data) ? data : [];
        setOSsLiberadas(ossData);
        await fetchWorkflowsAtivos(ossData);
      } else if (response.status === 404) {
        // 404 = não há OSs liberadas ainda (estado normal)
        console.log('ℹ️ Nenhuma OS liberada para PCP ainda');
        setOSsLiberadas([]);
        await fetchWorkflowsAtivos([]);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao buscar OSs liberadas - Status:', response.status);
        console.error('❌ Erro ao buscar OSs liberadas - Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar OSs liberadas:', error);
      throw error; // Re-throw para que seja capturado pelo catch externo
    }
  };

  const fetchWorkflowsAtivos = async (osData?: OSLiberada[]) => {
    try {
      // TODO: Implementar endpoint para workflows ativos
      // Por enquanto, calcular baseado nas OSs liberadas
      const dataParaCalcular = osData || osLiberadas;
      const workflowsCalculados = dataParaCalcular
        .filter(os => os.workflow_instanciado && os.workflow_status === 'ATIVO')
        .map(os => ({
          id: `wf_${os.id}`,
          os_id: os.id,
          workflow_template_id: 'template_1',
          status: os.workflow_status || 'ATIVO',
          progresso: os.workflow_progresso || 0,
          etapa_atual: 'Produção',
          criado_em: new Date().toISOString()
        }));
      
      setWorkflowsAtivos(workflowsCalculados);
      updateStats(dataParaCalcular, workflowsCalculados);
    } catch (error) {
      console.error('Erro ao buscar workflows ativos:', error);
    }
  };

  const updateStats = (osData: OSLiberada[], workflowData: WorkflowInstancia[]) => {
    const totalOSs = osData.length;
    const workflowsAtivos = workflowData.filter(w => w.status === 'ATIVO').length;
    const etapasPendentes = osData.filter(os => !os.workflow_instanciado).length;
    const eficienciaMedia = workflowData.length > 0 
      ? Math.round(workflowData.reduce((acc, w) => acc + w.progresso, 0) / workflowData.length)
      : 0;

    setStats({
      totalOSsLiberadas: totalOSs,
      workflowsAtivos,
      etapasPendentes,
      eficienciaMedia
    });
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleIniciarWorkflow = async (osId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      // TODO: Implementar endpoint para iniciar workflow
      toast.success(`Workflow iniciado para OS ${osId}`);
      fetchData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao iniciar workflow');
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'CRITICA': return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'default';
      case 'PAUSADO': return 'secondary';
      case 'CONCLUIDO': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              PCP - Planejamento e Controle de Produção
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Carregando dados...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PCP - Planejamento e Controle de Produção
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie workflows, etapas e apontamentos de produção
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/pcp/workflows/novo">
              <IconPlus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OSs Liberadas</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOSsLiberadas}</div>
            <p className="text-xs text-muted-foreground">
              Prontas para PCP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Ativos</CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workflowsAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etapas Pendentes</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.etapasPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando workflow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Média</CardTitle>
            <IconSettings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eficienciaMedia}%</div>
            <p className="text-xs text-muted-foreground">
              Progresso médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OSs Liberadas para PCP */}
        <Card>
          <CardHeader>
            <CardTitle>OSs Liberadas para PCP</CardTitle>
            <CardDescription>
              Ordens de serviço prontas para iniciar workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {osLiberadas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <IconBuilding className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma OS liberada para PCP</p>
                </div>
              ) : (
                osLiberadas.slice(0, 5).map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{os.nome_servico}</div>
                      <div className="text-sm text-gray-500">{os.numero} • {os.cliente?.nome || 'Cliente não informado'}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPrioridadeColor(os.prioridade)}>
                          {os.prioridade}
                        </Badge>
                        {os.data_prazo && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <IconClock className="h-3 w-3" />
                            {new Date(os.data_prazo).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {os.workflow_instanciado ? (
                        <Badge variant="default">
                          Workflow Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Aguardando
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/os/${os.id}`}>
                          <IconEye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!os.workflow_instanciado && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleIniciarWorkflow(os.id)}
                        >
                          <IconPlus className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflows Ativos */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows Ativos</CardTitle>
            <CardDescription>
              Workflows em execução e seu progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowsAtivos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <IconClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum workflow ativo</p>
                </div>
              ) : (
                workflowsAtivos.slice(0, 5).map((workflow) => {
                  const os = osLiberadas.find(o => o.id === workflow.os_id);
                  return (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{os?.nome_servico || 'OS não encontrada'}</div>
                        <div className="text-sm text-gray-500">{os?.numero || workflow.os_id}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${workflow.progresso}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {workflow.progresso}% concluído
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(workflow.status) as any}>
                          {workflow.status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pcp/workflows/${workflow.id}`}>
                            <IconEye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades do PCP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/workflows">
                <IconBuilding className="h-6 w-6 mb-2" />
                Gerenciar Workflows
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/kanban">
                <IconClipboardList className="h-6 w-6 mb-2" />
                Kanban PCP
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/os?status=LIBERADA_PARA_PCP">
                <IconChartBar className="h-6 w-6 mb-2" />
                OSs Liberadas
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/pcp/workflows/novo">
                <IconPlus className="h-6 w-6 mb-2" />
                Novo Workflow
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
