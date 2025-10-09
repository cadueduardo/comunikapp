'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Settings, 
  Wrench, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Printer,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

interface AprovacaoTecnica {
  status?: string;
  responsavel?: string;
  data?: Date;
  observacoes?: string;
}

interface AgendamentoInstalacao {
  data_instalacao_agendada?: Date;
  observacoes_instalacao?: string;
}

interface OSDetalhesSectionsProps {
  os: {
    id: string;
    numero: string;
    nome_servico: string;
    descricao?: string;
    quantidade: number;
    parametros_tecnicos?: any;
    insumos_calculados?: any[];
    aprovacao_tecnica_status?: string;
    aprovacao_tecnica_por?: string;
    aprovacao_tecnica_em?: Date;
    aprovacao_tecnica_obs?: string;
    data_instalacao_agendada?: Date;
    observacoes_instalacao?: string;
  };
  dadosTransformados?: DadosTransformacao;
  onImprimirOS?: () => void;
}

export function OSDetalhesSections({ os, dadosTransformados, onImprimirOS }: OSDetalhesSectionsProps) {
  
  // Seção de Materiais Principais
  const renderMateriaisPrincipais = () => {
    const materiais = dadosTransformados?.materiaisPrincipais || [];
    
    if (materiais.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          Nenhum material principal identificado
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {materiais.map((material, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{material.nome}</div>
              <div className="text-xs text-gray-600">
                {material.display || `${material.quantidade} ${material.unidade}`}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">
                {formatCurrency(material.custo_total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Seção de Acabamentos
  const renderAcabamentos = () => {
    const acabamentos = dadosTransformados?.acabamentos || [];
    
    if (acabamentos.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          Nenhum acabamento identificado
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {acabamentos.map((acabamento, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
            <div className="flex-1">
              <div className="font-medium text-sm">{acabamento.nome}</div>
              {acabamento.descricao && (
                <div className="text-xs text-gray-600">{acabamento.descricao}</div>
              )}
              {acabamento.categoria && (
                <Badge variant="outline" className="text-xs mt-1">
                  {acabamento.categoria}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">
                {formatCurrency(acabamento.custo_total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Seção de Instalação
  const renderInstalacao = () => {
    const instalacaoNecessaria = dadosTransformados?.instalacaoNecessaria || false;
    
    if (!instalacaoNecessaria) {
      return (
        <div className="text-sm text-gray-500 italic">
          Instalação não necessária
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Instalação Externa Necessária
          </span>
        </div>
        
        {os.data_instalacao_agendada && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Agendada para: {new Date(os.data_instalacao_agendada).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        
        {os.observacoes_instalacao && (
          <div className="p-2 bg-yellow-50 rounded">
            <div className="text-xs font-medium text-yellow-800 mb-1">Observações:</div>
            <div className="text-sm text-yellow-700">{os.observacoes_instalacao}</div>
          </div>
        )}
      </div>
    );
  };

  // Seção de Aprovação Técnica
  const renderAprovacaoTecnica = () => {
    const status = os.aprovacao_tecnica_status || 'PENDENTE';
    const responsavel = os.aprovacao_tecnica_por;
    const data = os.aprovacao_tecnica_em;
    const observacoes = os.aprovacao_tecnica_obs;

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'APROVADO':
          return { 
            variant: 'default' as const, 
            color: 'bg-green-100 text-green-800',
            icon: CheckCircle 
          };
        case 'REJEITADO':
          return { 
            variant: 'destructive' as const, 
            color: 'bg-red-100 text-red-800',
            icon: AlertTriangle 
          };
        case 'PENDENTE':
        default:
          return { 
            variant: 'secondary' as const, 
            color: 'bg-yellow-100 text-yellow-800',
            icon: Clock 
          };
      }
    };

    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <StatusIcon className="h-4 w-4" />
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {status}
          </Badge>
        </div>
        
        {responsavel && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Responsável: {responsavel}</span>
          </div>
        )}
        
        {data && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Data: {new Date(data).toLocaleDateString('pt-BR')} às {new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        {observacoes && (
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs font-medium text-gray-800 mb-1">Observações:</div>
            <div className="text-sm text-gray-700">{observacoes}</div>
          </div>
        )}
      </div>
    );
  };

  // Seção de Especificações Técnicas
  const renderEspecificacoesTecnicas = () => {
    const parametros = os.parametros_tecnicos;
    
    if (!parametros) {
      return (
        <div className="text-sm text-gray-500 italic">
          Nenhuma especificação técnica disponível
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {parametros.largura && (
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs font-medium text-gray-600">Largura</div>
            <div className="text-sm font-medium">{parametros.largura} {parametros.unidade_medida || 'm'}</div>
          </div>
        )}
        
        {parametros.altura && (
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs font-medium text-gray-600">Altura</div>
            <div className="text-sm font-medium">{parametros.altura} {parametros.unidade_medida || 'm'}</div>
          </div>
        )}
        
        {parametros.area && (
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs font-medium text-gray-600">Área</div>
            <div className="text-sm font-medium">{parametros.area} m²</div>
          </div>
        )}
        
        {parametros.quantidade && (
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs font-medium text-gray-600">Quantidade</div>
            <div className="text-sm font-medium">{os.quantidade} unidades</div>
          </div>
        )}
      </div>
    );
  };

  // Seção de Tipo de Impressão
  const renderTipoImpressao = () => {
    const tipoImpressao = dadosTransformados?.tipoImpressao;
    
    if (!tipoImpressao) {
      return (
        <div className="text-sm text-gray-500 italic">
          Tipo de impressão não identificado
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div className="font-medium text-sm">{tipoImpressao.tipo}</div>
            <div className="text-xs text-gray-600">Máquina: {tipoImpressao.maquina}</div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {tipoImpressao.confianca}% confiança
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-6">Detalhes Técnicos</h2>
      </div>

      {/* Especificações e Materiais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Especificações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Especificações Técnicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderEspecificacoesTecnicas()}
          </CardContent>
        </Card>

        {/* Materiais e Impressão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Materiais e Impressão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Materiais Principais</h4>
              {renderMateriaisPrincipais()}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Tipo de Impressão</h4>
              {renderTipoImpressao()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acabamentos e Aprovação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acabamentos e Instalação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Acabamentos e Instalação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Acabamentos</h4>
              {renderAcabamentos()}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-3">Instalação</h4>
              {renderInstalacao()}
            </div>
          </CardContent>
        </Card>

        {/* Aprovação Técnica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Aprovação Técnica</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderAprovacaoTecnica()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
