"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Printer,
  ClipboardList,
  Package,
  CheckCircle,
  Settings,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { OrdemServico } from "../columns";
import { PrazoOSComponent } from "@/components/os/PrazoOSComponent";
import { ListaProdutosComPrazo } from "@/components/os/ListaProdutosComPrazo";
import { ArteAprovacaoTab } from "@/components/os/arte-aprovacao/ArteAprovacaoTab";
import { ArteAprovacaoSidebar } from "@/components/os/arte-aprovacao/ArteAprovacaoSidebar";
import { ResumoOSSidebar } from "@/components/os/ResumoOSSidebar";
import { useOsStatus } from "@/hooks/use-os-status";

interface OSDetalhada extends OrdemServico {
  // Mantendo apenas as interfaces essenciais
}

type TabType = 'resumo' | 'arte-aprovacao' | 'materiais' | 'analise-inteligente';

// Função para renderizar a aba Resumo
function renderResumoTab(os: OSDetalhada, isResumoCollapsed: boolean, setIsResumoCollapsed: React.Dispatch<React.SetStateAction<boolean>>, statusDinamico: string) {

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar Esquerdo - Persistente (25% desktop, full mobile) */}
      <ResumoOSSidebar 
        osId={os.id}
        clienteNome={os.cliente_nome || "Carla Conceição"}
        projeto={os.nome_servico}
        dataPrazo={os.data_prazo ? new Date(os.data_prazo) : undefined}
        prioridade="Normal"
        status={statusDinamico}
        isCollapsed={isResumoCollapsed}
        onCollapsedChange={setIsResumoCollapsed}
        onPrazoChange={(novaData) => {
          // Atualizar o estado local da OS
          // Pode ser expandido para atualizar o cache ou recarregar dados
        }}
      />

      {/* Linha Separadora - Desktop only */}
      <div className="hidden lg:block w-px bg-gray-200"></div>

      {/* Conteúdo Central (50% desktop, full mobile) */}
      <div className="w-full lg:flex-1 lg:px-6">
        <div className="space-y-6">
          {/* Produtos e Prazos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos e Prazos de Produção</h3>
            
            <ListaProdutosComPrazo 
              osId={os.id}
              prazoFinalOS={os.data_prazo ? new Date(os.data_prazo) : undefined}
            />
          </div>

        </div>
      </div>

      {/* Linha Separadora - Desktop only */}
      <div className="hidden lg:block w-px bg-gray-200"></div>

      {/* Sidebar Direito - Dinâmico (25% desktop, full mobile) */}
      <div className="w-full lg:w-[25%] lg:pl-6 mt-6 lg:mt-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist de Estoque</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Estoque OK</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Bobina Lona Impressão 1,40x50m</span>
                <span className="text-sm font-medium text-green-600">Disponível</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cabo de Madeira 19mm</span>
                <span className="text-sm font-medium text-green-600">Disponível</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cordão 3mm Branco</span>
                <span className="text-sm font-medium text-green-600">Disponível</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Abas simplificado
function OSTabsComponent({ os, isResumoCollapsed, setIsResumoCollapsed, statusDinamico }: { 
  os: OSDetalhada; 
  isResumoCollapsed: boolean; 
  setIsResumoCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  statusDinamico: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obter aba ativa da URL ou usar 'resumo' como padrão
  const getActiveTabFromURL = (): TabType => {
    const tab = searchParams.get('tab') as TabType;
    return tab && ['resumo', 'arte-aprovacao', 'materiais', 'analise-inteligente'].includes(tab) 
      ? tab 
      : 'resumo';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromURL);
  
  // Atualizar aba ativa quando URL mudar
  useEffect(() => {
    const tabFromURL = getActiveTabFromURL();
    setActiveTab(tabFromURL);
  }, [searchParams]);
  
  // Função para mudar aba e atualizar URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Atualizar URL sem recarregar a página
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/os/${os.id}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: 'resumo' as TabType, label: 'Resumo', icon: Package },
    { id: 'arte-aprovacao' as TabType, label: '🎨 Arte & Aprovação', icon: CheckCircle },
    { id: 'materiais' as TabType, label: 'Materiais', icon: Package },
    { id: 'analise-inteligente' as TabType, label: 'Análise Inteligente', icon: Settings },
  ];

  return (
    <div className="bg-gray-50">
      {/* Navegação por Abas - Design responsivo */}
      <div>
        <nav className="flex w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-2 sm:py-3 md:py-4 px-1 sm:px-2 border-b-2 font-medium flex flex-col items-center space-y-0.5 sm:space-y-1 transition-colors duration-200 min-h-[60px] sm:min-h-[70px] ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-center leading-tight font-medium">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'arte-aprovacao' ? (
        // Layout especial para Arte & Aprovação: Sidebar Esquerdo (Resumo OS) + Área Principal + Sidebar Direito (Arte)
        <div className="flex flex-col lg:flex-row h-full p-4 lg:p-6 bg-white">
          {/* Sidebar Esquerdo - Resumo da OS (25%) */}
          <ResumoOSSidebar 
            osId={os.id}
            clienteNome={os.cliente_nome || "Carla Conceição"}
            projeto={os.nome_servico}
            dataPrazo={os.data_prazo ? new Date(os.data_prazo) : undefined}
            prioridade="Normal"
            status={statusDinamico}
            isCollapsed={isResumoCollapsed}
            onCollapsedChange={setIsResumoCollapsed}
          />
          
          {/* Linha Separadora - Desktop only */}
          <div className="hidden lg:block w-px bg-gray-200 mx-4"></div>
          
          {/* Área Principal - Miolo (50% desktop) */}
          <div className="w-full lg:flex-1 lg:px-4">
            <ArteAprovacaoTab 
              osId={os.id} 
              readonly={false}
            />
          </div>
          
          {/* Linha Separadora - Desktop only */}
          <div className="hidden lg:block w-px bg-gray-200 mx-4"></div>
          
          {/* Sidebar Direito - Arte & Aprovação (25% desktop) */}
          <div className="w-full lg:w-[25%] lg:pl-4 mt-6 lg:mt-0 lg:min-w-0">
            <ArteAprovacaoSidebar 
              osId={os.id}
              osNumero={os.numero}
              onEnviarTodasArtes={() => {
                // Esta função será passada do ArteAprovacaoTab
                console.log('Enviar todas as artes - implementar integração');
              }}
              hasVersoesRascunho={true}
            />
          </div>
        </div>
      ) : (
        // Layout padrão para outras abas com Sidebar Esquerdo (Resumo OS) + Conteúdo
        <div className="p-4 lg:p-6 h-full bg-white">
          {activeTab === 'resumo' && renderResumoTab(os, isResumoCollapsed, setIsResumoCollapsed, statusDinamico)}
          
          {activeTab === 'materiais' && (
            <div className="flex flex-col lg:flex-row h-full">
              {/* Sidebar Esquerdo - Resumo da OS (25%) */}
              <ResumoOSSidebar 
                osId={os.id}
                clienteNome={os.cliente_nome || "Carla Conceição"}
                projeto={os.nome_servico}
                dataPrazo={os.data_prazo ? new Date(os.data_prazo) : undefined}
                prioridade="Normal"
                status={statusDinamico}
                isCollapsed={isResumoCollapsed}
                onCollapsedChange={setIsResumoCollapsed}
              />
              
              {/* Linha Separadora - Desktop only */}
              <div className="hidden lg:block w-px bg-gray-200"></div>
              
              {/* Conteúdo Central */}
              <div className="w-full lg:flex-1 lg:px-6">
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Aba "Materiais" Selecionada
                  </h2>
                  <p className="text-gray-600">
                    Conteúdo da aba será implementado nas próximas etapas.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analise-inteligente' && (
            <div className="flex flex-col lg:flex-row h-full">
              {/* Sidebar Esquerdo - Resumo da OS (25%) */}
              <ResumoOSSidebar 
                osId={os.id}
                clienteNome={os.cliente_nome || "Carla Conceição"}
                projeto={os.nome_servico}
                dataPrazo={os.data_prazo ? new Date(os.data_prazo) : undefined}
                prioridade="Normal"
                status={statusDinamico}
                isCollapsed={isResumoCollapsed}
                onCollapsedChange={setIsResumoCollapsed}
              />
              
              {/* Linha Separadora - Desktop only */}
              <div className="hidden lg:block w-px bg-gray-200"></div>
              
              {/* Conteúdo Central */}
              <div className="w-full lg:flex-1 lg:px-6">
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Aba "Análise Inteligente" Selecionada
                  </h2>
                  <p className="text-gray-600">
                    Conteúdo da aba será implementado nas próximas etapas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OSDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [os, setOS] = useState<OSDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResumoCollapsed, setIsResumoCollapsed] = useState(false);
  
  // Hook para buscar status dinâmico da OS baseado nas versões de arte
  const { statusTexto: statusDinamico } = useOsStatus(os?.id || '');

  useEffect(() => {
    if (params.id) {
      fetchOS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchOS = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/os/${params.id}`);

      if (!response.ok) {
        throw new Error("OS nao encontrada");
      }

      const payload = await response.json();
      const osData = (payload && payload.data ? payload.data : payload) as OSDetalhada | undefined;

      if (!osData || !osData.id) {
        throw new Error("OS nao encontrada");
      }

      setOS(osData);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
      toast.error("Erro ao carregar ordem de servico");
      router.push("/os");
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirOS = () => {
    if (!os) return;
    
    // Abrir template de impressão em nova aba
    window.open(`/os/${os.id}/imprimir`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ordem de servico...</p>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ordem de servico nao encontrada</p>
          <Link href="/os">
            <Button className="mt-4" variant="outline">
              Voltar para lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const podeEditar = os.status !== "FINALIZADA" && os.status !== "CANCELADA";

  return (
    <div className="min-h-screen bg-white">
      {/* Header conforme a imagem */}
      <div className="bg-white px-4 sm:px-6 py-4">
        {/* Layout responsivo: Desktop em linha, Mobile em coluna */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Lado esquerdo: Título */}
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {os.nome_servico}
              </h1>
              <p className="text-sm text-gray-600">
                #{os.numero}
              </p>
            </div>
          </div>

          {/* Lado direito: Botões */}
          <div className="flex items-center justify-between lg:justify-end space-x-3">
            {/* Botão Voltar - Mobile only */}
            <Link href="/os" className="lg:hidden">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </Link>

            {/* Botões de ação */}
            <div className="flex items-center space-x-3">
                  <Button
                onClick={handleImprimirOS} 
                    variant="outline"
                className="flex items-center space-x-2"
              >
              <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir OS</span>
            </Button>

            {podeEditar && (
              <Link href={`/os/${os.id}/editar`}>
                  <Button className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar OS</span>
                    </Button>
                  </Link>
              )}
            </div>
              </div>
              </div>
      </div>

      {/* Linha separadora sutil */}
      <div className="h-px bg-gray-100"></div>

          {/* Sistema de Abas */}
      <OSTabsComponent 
        os={os} 
        isResumoCollapsed={isResumoCollapsed} 
        setIsResumoCollapsed={setIsResumoCollapsed}
        statusDinamico={statusDinamico}
      />
    </div>
  );
}