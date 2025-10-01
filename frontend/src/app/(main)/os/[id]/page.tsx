"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/PageHeader";
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { OrdemServico } from "../columns";

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
}

const getStatusConfig = (status: string) => {
  const configs = {
    FILA: { variant: "secondary" as const, label: "Na fila", color: "bg-gray-100 text-gray-800" },
    PRODUCAO: { variant: "default" as const, label: "Em producao", color: "bg-blue-100 text-blue-800" },
    ACABAMENTO: { variant: "outline" as const, label: "Acabamento", color: "bg-yellow-100 text-yellow-800" },
    FINALIZADA: { variant: "default" as const, label: "Finalizada", color: "bg-green-100 text-green-800" },
    CANCELADA: { variant: "destructive" as const, label: "Cancelada", color: "bg-red-100 text-red-800" },
    AGUARDANDO_MATERIAL: {
      variant: "outline" as const,
      label: "Aguardando material",
      color: "bg-orange-100 text-orange-800",
    },
    PAUSADA: { variant: "secondary" as const, label: "Pausada", color: "bg-purple-100 text-purple-800" },
  };

  return configs[status as keyof typeof configs] || {
    variant: "outline" as const,
    label: status,
    color: "bg-gray-100 text-gray-800",
  };
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
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
      toast.error("Erro ao carregar ordem de servico");
      router.push("/os");
    } finally {
      setLoading(false);
    }
  };

  const handleAvancarEtapa = async (novaEtapa: string) => {
    try {
      const response = await apiRequest(`/os/${params.id}/avancar-etapa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nova_etapa: novaEtapa,
          observacoes: `Etapa avancada para ${novaEtapa}`,
        }),
      });

      if (response.ok) {
        toast.success(`Etapa avancada para ${novaEtapa}`);
        fetchOS();
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && errorData.message) || "Erro ao avancar etapa");
      }
    } catch (error) {
      console.error("Erro ao avancar etapa:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao avancar etapa");
    }
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
  const podeEditar = os.status !== "FINALIZADA" && os.status !== "CANCELADA";
  const alertasEstoque = os.alertas_estoque ?? [];
  const recomendacoesEstoque = os.recomendacoes_estoque ?? [];
  const detalhesEstoque = os.detalhes_estoque ?? [];

  const proximasEtapas: Record<string, string[]> = {
    FILA: ["PRODUCAO"],
    PRODUCAO: ["ACABAMENTO"],
    ACABAMENTO: ["FINALIZADA"],
    PAUSADA: ["FILA", "PRODUCAO", "ACABAMENTO"],
    AGUARDANDO_MATERIAL: ["FILA", "PRODUCAO"],
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informacoes gerais
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
                  <label className="text-sm font-medium text-gray-500">Dimensoes</label>
                  <div className="mt-1">
                    {os.parametros_tecnicos.largura && os.parametros_tecnicos.altura ? (
                      <span>
                        {os.parametros_tecnicos.largura} x {os.parametros_tecnicos.altura}{" "}
                        {os.parametros_tecnicos.unidade_medida || "un"}
                      </span>
                    ) : (
                      <span>Parametros nao informados</span>
                    )}
                  </div>
                </div>
              )}

              {os.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descricao</label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{os.descricao}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Movimentacoes recentes
                </CardTitle>
                {os.movimentacoes && os.movimentacoes.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {os.movimentacoes.map((mov) => (
                      <li key={mov.id} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <span className="font-medium">{mov.etapa_atual}</span>
                          <span>{new Date(mov.data_movimentacao).toLocaleString("pt-BR")}</span>
                        </div>
                        {mov.observacoes && (
                          <p className="text-gray-500 mt-1">{mov.observacoes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma movimentacao registrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          {os.checklists && os.checklists.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {os.checklists.map((item) => (
                  <div key={item.id} className="border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.item_checklist}</span>
                      <Badge variant={item.concluido ? "default" : "outline"}>
                        {item.concluido ? "Concluido" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Etapa: {item.etapa}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prazos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Data de abertura</label>
                <div className="mt-1">
                  {new Date(os.criado_em).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {dataPrazo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Data limite</label>
                  <div
                    className={`mt-1 flex items-center gap-2 ${
                      isAtrasada ? "text-red-600 font-medium" : isVencendo ? "text-yellow-600" : "text-gray-700"
                    }`}
                  >
                    <span>{dataPrazo.toLocaleDateString("pt-BR")}</span>
                    {isAtrasada && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {isVencendo && !isAtrasada && <Clock className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materiais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {os.materiais_disponivel ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-medium">Materiais disponiveis</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-600 font-medium">Verificar disponibilidade</span>
                  </>
                )}
              </div>

              {alertasEstoque.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-orange-600">Alertas</label>
                  <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                    {alertasEstoque.map((alerta, index) => (
                      <li key={`alerta-${index}`}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recomendacoesEstoque.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-blue-600">Recomendacoes</label>
                  <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                    {recomendacoesEstoque.map((item, index) => (
                      <li key={`recomendacao-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detalhesEstoque.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Detalhes por insumo</label>
                  {detalhesEstoque.map((detalhe) => {
                    const nome = detalhe.nome || detalhe.insumo_id;
                    const disponibilidade =
                      detalhe.quantidade_disponivel !== undefined && detalhe.quantidade_necessaria !== undefined
                        ? `${detalhe.quantidade_disponivel}/${detalhe.quantidade_necessaria}`
                        : undefined;

                    return (
                      <div key={detalhe.insumo_id} className="border rounded-md p-3 text-sm bg-gray-50 space-y-1">
                        <div className="font-medium text-gray-800">{nome}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-600">
                          {detalhe.categoria && <span>Categoria: {detalhe.categoria}</span>}
                          {detalhe.fornecedor && <span>Fornecedor: {detalhe.fornecedor}</span>}
                          {detalhe.estoque_atual !== undefined && <span>Estoque atual: {detalhe.estoque_atual}</span>}
                          {detalhe.estoque_minimo !== undefined && <span>Estoque minimo: {detalhe.estoque_minimo}</span>}
                          {disponibilidade && <span>Disponivel apos reserva: {disponibilidade}</span>}
                          {detalhe.percentual_disponivel !== undefined && (
                            <span>Percentual disponivel: {Math.round(detalhe.percentual_disponivel)}%</span>
                          )}
                          {detalhe.unidade && <span>Unidade: {detalhe.unidade}</span>}
                        </div>
                        {(detalhe.alerta_estoque || detalhe.alerta_estoque_minimo || detalhe.alerta_fornecedor) && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Alerta ativo para este insumo
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {podeEditar && etapasDisponiveis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Avancar etapa
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
                      Avancar para {etapaConfig.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {os.responsavel_nome && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Responsavel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700">{os.responsavel_nome}</div>
              </CardContent>
            </Card>
          )}

          {os.orcamento_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Orcamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/orcamentos/${os.orcamento_id}`}>
                  <Button variant="outline" className="w-full">
                    Ver orcamento original
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
