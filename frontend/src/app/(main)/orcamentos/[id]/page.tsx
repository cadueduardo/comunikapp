'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Share2, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Orcamento {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  horas_producao: number;
  largura_produto?: number;
  altura_produto?: number;
  unidade_medida_produto?: string;
  area_produto?: number;
  custo_material: number;
  custo_mao_obra: number;
  custo_indireto: number;
  custo_total: number;
  margem_lucro: number;
  impostos: number;
  preco_final: number;
  criado_em: string;
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  itens?: Array<{
    id: string;
    insumo: {
      nome: string;
      unidade_medida: string;
    };
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
  maquinas?: Array<{
    id: string;
    maquina: {
      nome: string;
      tipo: string;
    };
    horas_utilizadas: number;
    custo_total: number;
  }>;
  funcoes?: Array<{
    id: string;
    funcao: {
      nome: string;
    };
    horas_trabalhadas: number;
    custo_total: number;
  }>;
}

export default function VisualizarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrcamento();
  }, [id]);

  const fetchOrcamento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/orcamentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrcamento(data);
      } else {
        toast.error('Falha ao buscar dados do orçamento.');
        router.push('/orcamentos');
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao buscar o orçamento.');
      console.error(err);
      router.push('/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const publicUrl = `${window.location.origin}/orcamento/${orcamento?.id}`;
      
      // Tenta usar a Web Share API
      if (navigator.share) {
        await navigator.share({
          title: `Orçamento ${orcamento?.numero}`,
          text: `Confira o orçamento ${orcamento?.nome_servico}`,
          url: publicUrl,
        });
      } else {
        // Fallback: copia para clipboard
        await navigator.clipboard.writeText(publicUrl);
        toast.success('Link público copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar orçamento.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implementar geração de PDF
    toast.info('Funcionalidade de PDF em desenvolvimento.');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Orçamento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O orçamento que você está procurando não existe ou foi removido.
          </p>
          <Link href="/orcamentos">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Orçamentos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orcamentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{orcamento.nome_servico}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">#{orcamento.numero}</Badge>
              <span className="text-sm text-muted-foreground">
                Criado em {new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Link href={`/orcamentos/${orcamento.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes do Serviço */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              {orcamento.descricao && (
                <p className="text-muted-foreground mb-4">{orcamento.descricao}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tempo de Produção</label>
                  <p className="text-lg">{orcamento.horas_producao}h</p>
                </div>
                {orcamento.area_produto && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Área do Produto</label>
                    <p className="text-lg">{orcamento.area_produto}m²</p>
                  </div>
                )}
                {orcamento.largura_produto && orcamento.altura_produto && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Largura</label>
                      <p className="text-lg">{orcamento.largura_produto}{orcamento.unidade_medida_produto}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Altura</label>
                      <p className="text-lg">{orcamento.altura_produto}{orcamento.unidade_medida_produto}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Materiais Utilizados */}
          {orcamento.itens && orcamento.itens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Materiais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orcamento.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.insumo.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade} {item.insumo.unidade_medida}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.custo_total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.custo_unitario)}/un
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Máquinas Utilizadas */}
          {orcamento.maquinas && orcamento.maquinas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Máquinas Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orcamento.maquinas.map((maquina) => (
                    <div key={maquina.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{maquina.maquina.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {maquina.horas_utilizadas}h de utilização
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(maquina.custo_total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mão de Obra */}
          {orcamento.funcoes && orcamento.funcoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mão de Obra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orcamento.funcoes.map((funcao) => (
                    <div key={funcao.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{funcao.funcao.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {funcao.horas_trabalhadas}h de trabalho
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(funcao.custo_total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar com Resumo */}
        <div className="space-y-6">
          {/* Cliente */}
          {orcamento.cliente && (
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{orcamento.cliente.nome}</p>
                {orcamento.cliente.email && (
                  <p className="text-sm text-muted-foreground">{orcamento.cliente.email}</p>
                )}
                {orcamento.cliente.telefone && (
                  <p className="text-sm text-muted-foreground">{orcamento.cliente.telefone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo de Materiais</span>
                  <span>{formatCurrency(orcamento.custo_material)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mão de Obra</span>
                  <span>{formatCurrency(orcamento.custo_mao_obra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Indiretos</span>
                  <span>{formatCurrency(orcamento.custo_indireto)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orcamento.custo_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margem de Lucro ({orcamento.margem_lucro}%)</span>
                  <span>{formatCurrency(orcamento.custo_total * (orcamento.margem_lucro / 100))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impostos ({orcamento.impostos}%)</span>
                  <span>{formatCurrency(orcamento.preco_final * (orcamento.impostos / 100))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-green-600">
                  <span>Preço Final</span>
                  <span>{formatCurrency(orcamento.preco_final)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 