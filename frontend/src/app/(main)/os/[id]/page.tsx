"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { OrdemServico } from "../columns";
import { 
  TransformacaoDadosHelper,
  OSHeader,
  OSSidebar,
  OSTabs,
  OSTimeline,
  OSWorkflowActions
} from "@/components/ui/os";

interface EstoqueDetalhe {
  insumo_id: string;
  nome?: string;
  categoria?: string;
  fornecedor?: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  quantidade_necessaria?: number;
  quantidade_disponivel?: number;
  percentual_disponivel?: number;
  unidade?: string;
  alerta_estoque?: boolean;
  alerta_estoque_minimo?: boolean;
  alerta_fornecedor?: boolean;
}

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
  alertas_estoque?: string[];
  recomendacoes_estoque?: string[];
  detalhes_estoque?: EstoqueDetalhe[];
  
  // Novos campos estruturados
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  produtos?: Array<{
    id: string;
    nome: string;
    descricao?: string;
    quantidade: number;
    unidade_medida?: string;
    largura?: number;
    altura?: number;
    profundidade?: number;
    area_produto?: number;
    observacoes?: string;
    materiais: Array<{
      id: string;
      nome: string;
      quantidade: number;
      unidade: string;
      categoria: string;
      tipo_material?: string;
      logica_consumo?: string;
      parametros_consumo?: any;
    }>;
    maquinas: Array<{
      id: string;
      nome: string;
      horas_uso: number;
      custo_hora: number;
      custo_total: number;
    }>;
    funcoes: Array<{
      id: string;
      nome: string;
      horas_uso: number;
      custo_hora: number;
      custo_total: number;
    }>;
  }>;
  materiais_consolidados?: Array<{
    id: string;
    nome: string;
    quantidade_total: number;
    unidade: string;
    categoria: string;
    tipo_material?: string;
    logica_consumo?: string;
    parametros_consumo?: any;
    produtos: Array<{
      nome: string;
      quantidade: number;
      quantidade_material: number;
    }>;
  }>;
}

// Removido - agora está no OSHeader

export default function OSDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [os, setOS] = useState<OSDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [dadosTransformados, setDadosTransformados] = useState<any>(null);

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

      setOS({
        ...osData,
        alertas_estoque: osData.alertas_estoque ?? [],
        recomendacoes_estoque: osData.recomendacoes_estoque ?? [],
        detalhes_estoque: osData.detalhes_estoque ?? [],
      });

      // Transformar dados para exibição
      const transformados = TransformacaoDadosHelper.transformarDadosOS(osData);
      setDadosTransformados(transformados);
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

  const handleDuplicarOS = () => {
    toast.info("Funcionalidade de duplicar OS em desenvolvimento");
  };

  const handleAdicionarNota = () => {
    toast.info("Funcionalidade de adicionar nota em desenvolvimento");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ordem de servico...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Ordem de servico nao encontrada</p>
        </div>
      </div>
    );
  }

  const podeEditar = os.status !== "FINALIZADA" && os.status !== "CANCELADA";

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho Principal */}
      <OSHeader 
        os={{
          ...os,
          pode_editar: podeEditar
        }}
        onImprimirOS={handleImprimirOS}
      />

      {/* Layout Principal - 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Conteúdo Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sistema de Abas */}
          <OSTabs 
            os={os}
            dadosTransformados={dadosTransformados}
            movimentacoes={os.movimentacoes}
          />

          {/* Timeline/Histórico */}
          <OSTimeline 
            movimentacoes={os.movimentacoes}
            os={os}
          />
        </div>

        {/* Coluna Direita - Painel Lateral (1/3) */}
        <div className="space-y-6">
          {/* Ações de Workflow */}
          <OSWorkflowActions 
            os={os}
            onStatusChange={fetchOS}
          />
          
          <OSSidebar 
            os={os}
            onDuplicarOS={handleDuplicarOS}
            onAdicionarNota={handleAdicionarNota}
          />
        </div>
      </div>
    </div>
  );
}
