"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ClipboardList,
  Package,
  Printer,
  Settings,
  MapPin,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { resolverRedirectArteLegado } from "@/lib/arte-navegacao";
import { OrdemServico } from "../columns";
import { ListaProdutosComPrazo } from "@/components/os/ListaProdutosComPrazo";
import { ResumoOSSidebar } from "@/components/os/ResumoOSSidebar";
import { OSMateriaisPanel } from "@/components/os/OSMateriaisPanel";
import { OsPosCalculoPanel } from "@/components/os/OsPosCalculoPanel";
import { InstalacaoOsPainel } from "@/components/instalacao/InstalacaoOsPainel";
import { ChecklistEstoque } from "@/components/ui/os/ChecklistEstoque";
import { useOsStatus } from "@/hooks/use-os-status";

interface MaterialOSDetalhe {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  display: string;
  categoria?: string;
  tipo_material?: string;
  disponivel_estoque?: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
  custo_unitario?: number;
  custo_total?: number;
}

interface ProdutoOSDetalhe {
  id: string;
  nome: string;
  quantidade: number;
  materiais?: MaterialOSDetalhe[];
}

interface OSDetalhada extends OrdemServico {
  prioridade?: string | null;
  alertas_estoque?: string[];
  recomendacoes_estoque?: string[];
  produtos?: ProdutoOSDetalhe[];
}

type TabType =
  | "resumo"
  | "materiais"
  | "instalacao"
  | "financeiro"
  | "analise-inteligente";

function formatarPrioridade(prioridade?: string | null): string {
  if (!prioridade) {
    return "Não informada";
  }

  const labels: Record<string, string> = {
    URGENTE: "Urgente",
    ALTA: "Alta",
    NORMAL: "Normal",
    BAIXA: "Baixa",
  };

  return labels[prioridade] || prioridade;
}

function SidebarResumoOS({
  os,
  isResumoCollapsed,
  setIsResumoCollapsed,
  statusDinamico,
}: {
  os: OSDetalhada;
  isResumoCollapsed: boolean;
  setIsResumoCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  statusDinamico: string;
}) {
  return (
    <ResumoOSSidebar
      osId={os.id}
      clienteNome={os.cliente_nome || "Cliente não informado"}
      projeto={os.nome_servico}
      dataPrazo={os.data_prazo ? new Date(os.data_prazo) : undefined}
      prioridade={formatarPrioridade(os.prioridade)}
      status={statusDinamico}
      isCollapsed={isResumoCollapsed}
      onCollapsedChange={setIsResumoCollapsed}
    />
  );
}

function renderResumoTab(
  os: OSDetalhada,
  isResumoCollapsed: boolean,
  setIsResumoCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
  statusDinamico: string,
) {
  return (
    <div className="flex flex-col lg:flex-row h-full">
      <SidebarResumoOS
        os={os}
        isResumoCollapsed={isResumoCollapsed}
        setIsResumoCollapsed={setIsResumoCollapsed}
        statusDinamico={statusDinamico}
      />

      <div className="hidden lg:block w-px bg-border" />

      <div className="w-full lg:flex-1 lg:px-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Produtos e Prazos de Produção
            </h3>
            <ListaProdutosComPrazo
              osId={os.id}
              prazoFinalOS={
                os.data_prazo ? new Date(os.data_prazo) : undefined
              }
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-px bg-border" />

      <div className="w-full lg:w-[25%] lg:pl-6 mt-6 lg:mt-0">
        <ChecklistEstoque
          produtos={os.produtos ?? []}
          materiais_disponivel={os.materiais_disponivel}
          alertas_estoque={os.alertas_estoque}
          recomendacoes_estoque={os.recomendacoes_estoque}
          aprovacao_tecnica_status={
            os.aprovacao_tecnica_status || "PENDENTE"
          }
        />
      </div>
    </div>
  );
}

function OSTabsComponent({
  os,
  isResumoCollapsed,
  setIsResumoCollapsed,
  statusDinamico,
}: {
  os: OSDetalhada;
  isResumoCollapsed: boolean;
  setIsResumoCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  statusDinamico: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getActiveTabFromURL = (): TabType => {
    const tab = searchParams.get("tab") as TabType;
    return tab &&
      [
        "resumo",
        "materiais",
        "instalacao",
        "financeiro",
        "analise-inteligente",
      ].includes(tab)
      ? tab
      : "resumo";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromURL);

  useEffect(() => {
    setActiveTab(getActiveTabFromURL());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/os/${os.id}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: "resumo" as TabType, label: "Resumo", icon: Package },
    { id: "materiais" as TabType, label: "Materiais", icon: Package },
    { id: "instalacao" as TabType, label: "Instalação", icon: MapPin },
    { id: "financeiro" as TabType, label: "Financeiro", icon: Wallet },
    {
      id: "analise-inteligente" as TabType,
      label: "Análise Inteligente",
      icon: Settings,
    },
  ];

  return (
    <div className="bg-muted/40">
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
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border bg-muted hover:bg-muted/80"
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

      <div className="p-4 lg:p-6 h-full bg-card">
        {activeTab === "resumo" &&
          renderResumoTab(
            os,
            isResumoCollapsed,
            setIsResumoCollapsed,
            statusDinamico,
          )}

        {activeTab === "materiais" && (
          <div className="flex flex-col lg:flex-row h-full">
            <SidebarResumoOS
              os={os}
              isResumoCollapsed={isResumoCollapsed}
              setIsResumoCollapsed={setIsResumoCollapsed}
              statusDinamico={statusDinamico}
            />
            <div className="hidden lg:block w-px bg-border" />
            <div className="w-full lg:flex-1 lg:px-6">
              <OSMateriaisPanel osId={os.id} />
            </div>
          </div>
        )}

        {activeTab === "instalacao" && (
          <div className="w-full min-w-0 overflow-x-hidden">
            <InstalacaoOsPainel osId={os.id} modo="consulta" />
          </div>
        )}

        {activeTab === "financeiro" && (
          <div className="w-full min-w-0">
            <OsPosCalculoPanel osId={os.id} />
          </div>
        )}

        {activeTab === "analise-inteligente" && (
          <div className="flex flex-col lg:flex-row h-full">
            <SidebarResumoOS
              os={os}
              isResumoCollapsed={isResumoCollapsed}
              setIsResumoCollapsed={setIsResumoCollapsed}
              statusDinamico={statusDinamico}
            />
            <div className="hidden lg:block w-px bg-border" />
            <div className="w-full lg:flex-1 lg:px-6">
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Análise Inteligente
                </h2>
                <p className="text-muted-foreground">
                  Conteúdo desta aba será ligado nas próximas etapas (P1-1).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OSDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [os, setOS] = useState<OSDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResumoCollapsed, setIsResumoCollapsed] = useState(false);

  const { statusTexto: statusDinamico } = useOsStatus(os?.id || "");

  useEffect(() => {
    if (!os?.id || searchParams.get("tab") !== "arte-aprovacao") return;
    void resolverRedirectArteLegado(os.id).then((destino) => {
      router.replace(destino);
    });
  }, [os?.id, searchParams, router]);

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
        throw new Error("OS não encontrada");
      }

      const payload = await response.json();
      const osData = (
        payload && payload.data ? payload.data : payload
      ) as OSDetalhada | undefined;

      if (!osData || !osData.id) {
        throw new Error("OS não encontrada");
      }

      setOS(osData);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
      toast.error("Erro ao carregar ordem de serviço");
      router.push("/os");
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirOS = () => {
    if (!os) return;
    window.open(`/os/${os.id}/imprimir`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto" />
          <p className="mt-2 text-muted-foreground">
            Carregando ordem de serviço...
          </p>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            Ordem de serviço não encontrada
          </p>
          <Link href="/os">
            <Button className="mt-4" variant="outline">
              Voltar para lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="bg-card px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {os.nome_servico}
              </h1>
              <p className="text-sm text-muted-foreground">#{os.numero}</p>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end space-x-3">
            <Link href="/os" className="lg:hidden">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </Link>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleImprimirOS}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimir OS</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <OSTabsComponent
        os={os}
        isResumoCollapsed={isResumoCollapsed}
        setIsResumoCollapsed={setIsResumoCollapsed}
        statusDinamico={statusDinamico}
      />
    </div>
  );
}
