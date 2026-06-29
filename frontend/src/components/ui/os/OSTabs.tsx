'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Settings, 
  CheckCircle, 
  Wrench, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import MateriaisTab from '@/components/os/materiais/MateriaisTab';
interface MaterialPrincipal {
  nome: string;
  quantidade: number;
  unidade: string;
  custo_total: number;
}

interface Acabamento {
  nome: string;
  descricao: string;
  categoria: string;
  custo_total: number;
}

interface TipoImpressao {
  tipo: string;
  maquina: string;
  confianca: number;
}

interface DadosTransformacao {
  prazoProducaoDias: number;
  dataEntregaCalculada: Date;
  materiaisPrincipais: MaterialPrincipal[];
  tipoImpressao: TipoImpressao | null;
  acabamentos: Acabamento[];
  instalacaoNecessaria: boolean;
}

interface OSTabsProps {
  os: {
    id: string;
    numero: string;
    nome_servico: string;
    descricao?: string;
    quantidade: number;
    status?: string;
    parametros_tecnicos?: any;
    aprovacao_tecnica_status?: string;
    aprovacao_tecnica_por?: string;
    aprovacao_tecnica_em?: Date;
    aprovacao_tecnica_obs?: string;
    data_instalacao_agendada?: Date;
    observacoes_instalacao?: string;
    insumos_calculados?: any[];
    produtos?: any[];
    materiais_consolidados?: any[];
  };
  dadosTransformados?: DadosTransformacao;
  movimentacoes?: Array<{
    id: string;
    etapa_anterior?: string;
    etapa_atual: string;
    usuario_id: string;
    data_movimentacao: string;
    observacoes?: string;
  }>;
}

type TabType = 'resumo' | 'materiais' | 'analise-inteligente';

export function OSTabs({ os, dadosTransformados, movimentacoes }: OSTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');

  // Helper para garantir que temos um número válido
  const formatCurrency = (value: any): string => {
    const num = Number(value) || 0;
    return num.toFixed(2);
  };

  const formatNumber = (value: any): number => {
    return Number(value) || 0;
  };

  const tabs = [
    { id: 'resumo' as TabType, label: 'Resumo', icon: Package },
    { id: 'materiais' as TabType, label: 'Materiais', icon: Package },
    { id: 'analise-inteligente' as TabType, label: 'Análise Inteligente', icon: Settings },
  ];

  // Renderização da aba Resumo
  const renderResumoTab = () => (
    <div className="space-y-6">
      {/* Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projeto: {os.nome_servico}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{os.descricao || 'Sem descrição disponível'}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <Badge variant="outline">{os.status}</Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total de Produtos</div>
              <div className="font-medium">{os.produtos?.length || 0} produtos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      {os.produtos && os.produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {os.produtos.map((produto, index) => (
                <div key={produto.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg">{produto.nome}</h3>
                      {produto.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{produto.descricao}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{produto.quantidade} unidades</Badge>
                  </div>
                  
                  {produto.observacoes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                      <strong>Observações:</strong> {produto.observacoes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materiais Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Materiais Principais</CardTitle>
        </CardHeader>
        <CardContent>
          {os.materiais_consolidados && os.materiais_consolidados.length > 0 ? (
            <div className="space-y-4">
              {os.materiais_consolidados.map((material, index) => (
                <div key={material.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{material.nome}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <Badge variant="outline" className="mr-2">
                          {material.quantidade_total} {material.unidade}
                        </Badge>
                        <span className="text-xs text-gray-500">{material.categoria}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Produtos que usam este material */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Usado em:</div>
                    <div className="space-y-1">
                      {material.produtos.map((produto: any, prodIndex: number) => (
                        <div key={prodIndex} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{produto.nome}</span>
                          <Badge variant="secondary" className="text-xs">
                            {produto.quantidade_material} {material.unidade}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Nenhum material principal identificado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Renderização da aba Técnico
  const renderTecnicoTab = () => (
    <div className="space-y-6">
      {/* Especificações Técnicas por Produto */}
      {os.produtos && os.produtos.length > 0 ? (
        os.produtos.map((produto, index) => (
          <Card key={produto.id}>
            <CardHeader>
              <CardTitle className="text-lg">Especificações Técnicas - {produto.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informações básicas do produto */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Quantidade</div>
                    <div className="font-medium">{produto.quantidade} unidades</div>
                  </div>
                  
                  {produto.unidade_medida && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Unidade de Medida</div>
                      <div className="font-medium">{produto.unidade_medida}</div>
                    </div>
                  )}
                </div>

                {/* Dimensões */}
                {(produto.largura || produto.altura || produto.profundidade || produto.area_produto) && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Dimensões</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {produto.largura && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Largura</div>
                          <div className="font-medium">{produto.largura} {produto.unidade_medida || 'cm'}</div>
                        </div>
                      )}
                      
                      {produto.altura && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Altura</div>
                          <div className="font-medium">{produto.altura} {produto.unidade_medida || 'cm'}</div>
                        </div>
                      )}
                      
                      {produto.profundidade && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Profundidade</div>
                          <div className="font-medium">{produto.profundidade} {produto.unidade_medida || 'cm'}</div>
                        </div>
                      )}
                      
                      {produto.area_produto && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Área</div>
                          <div className="font-medium">{produto.area_produto} m²</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Descrição */}
                {produto.descricao && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Descrição</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{produto.descricao}</p>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {produto.observacoes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Observações</h4>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{produto.observacoes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Especificações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 italic">
              Nenhuma especificação técnica disponível
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tipo de Impressão */}
      {dadosTransformados?.tipoImpressao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipo de Impressão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{dadosTransformados.tipoImpressao.tipo}</div>
                <div className="text-xs text-gray-600">Máquina: {dadosTransformados.tipoImpressao.maquina}</div>
              </div>
              <Badge variant="outline" className="text-xs">
                {dadosTransformados.tipoImpressao.confianca}% confiança
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Renderização da aba Materiais
  const renderMateriaisTab = () => (
    <MateriaisTab osData={os} dadosTransformados={dadosTransformados} />
  );

  // Renderização da aba Análise Inteligente
  const renderAnaliseInteligenteTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 italic">
            Funcionalidade em desenvolvimento...
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Renderização da aba Aprovação
  const renderAprovacaoTab = () => (
    <div className="space-y-6">
      {/* Status da Aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status da Aprovação Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {os.aprovacao_tecnica_status === 'APROVADO' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : os.aprovacao_tecnica_status === 'REJEITADO' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <Badge 
                variant={
                  os.aprovacao_tecnica_status === 'APROVADO' ? 'default' :
                  os.aprovacao_tecnica_status === 'REJEITADO' ? 'destructive' :
                  'secondary'
                }
              >
                {os.aprovacao_tecnica_status || 'PENDENTE'}
              </Badge>
            </div>
            
            {os.aprovacao_tecnica_por && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Responsável: {os.aprovacao_tecnica_por}</span>
              </div>
            )}
            
            {os.aprovacao_tecnica_em && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Data: {new Date(os.aprovacao_tecnica_em).toLocaleDateString('pt-BR')} às {new Date(os.aprovacao_tecnica_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            
            {os.aprovacao_tecnica_obs && (
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-800 mb-1">Observações:</div>
                <div className="text-sm text-gray-700">{os.aprovacao_tecnica_obs}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Renderização da aba Instalação
  const renderInstalacaoTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes da Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          {dadosTransformados?.instalacaoNecessaria ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Instalação Externa Necessária
                </span>
              </div>
              
              {os.data_instalacao_agendada && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Agendada para: {new Date(os.data_instalacao_agendada).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              {os.observacoes_instalacao && (
                <div className="p-3 bg-yellow-50 rounded">
                  <div className="text-sm font-medium text-yellow-800 mb-1">Observações:</div>
                  <div className="text-sm text-yellow-700">{os.observacoes_instalacao}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Instalação não necessária
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    console.log('🔄 Renderizando conteúdo da aba:', activeTab);
    switch (activeTab) {
      case 'resumo':
        return renderResumoTab();
      case 'materiais':
        return renderMateriaisTab();
      case 'analise-inteligente':
        return renderAnaliseInteligenteTab();
      default:
        console.log('⚠️ Aba padrão, activeTab:', activeTab);
        return renderResumoTab();
    }
  };

  return (
    <div className="space-y-4">
      {/* Navegação por Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('🖱️ Clicando na aba:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}
