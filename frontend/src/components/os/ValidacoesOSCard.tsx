'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Eye,
  History
} from 'lucide-react';

interface ValidacaoExecucao {
  regra_id: string;
  regra_nome: string;
  resultado: string;
  mensagem: string;
  tempo_execucao: number;
}

interface ResultadoValidacao {
  valida: boolean;
  pode_aprovar_automaticamente: boolean;
  correcoes_necessarias: string[];
  alertas: string[];
  acoes: any[];
  execucoes: ValidacaoExecucao[];
}

interface ValidacoesOSCardProps {
  osId: string;
  onValidacaoChange?: (resultado: ResultadoValidacao) => void;
}

export function ValidacoesOSCard({ osId, onValidacaoChange }: ValidacoesOSCardProps) {
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const executarValidacoes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/os/validacoes/${osId}/executar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        onValidacaoChange?.(data);
      } else {
        console.error('Erro ao executar validações');
      }
    } catch (error) {
      console.error('Erro ao executar validações:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    try {
      const response = await fetch(`/api/os/validacoes/${osId}/historico`);
      if (response.ok) {
        const data = await response.json();
        setHistorico(data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const executarDebug = async () => {
    try {
      const response = await fetch(`/api/debug/validacoes/os/${osId}`);
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        setShowDebug(true);
      }
    } catch (error) {
      console.error('Erro ao executar debug:', error);
    }
  };

  useEffect(() => {
    if (osId) {
      executarValidacoes();
    }
  }, [osId]);

  const getStatusIcon = (resultado: string) => {
    switch (resultado) {
      case 'SUCESSO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERRO':
      case 'BLOQUEIO':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ALERTA':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (resultado: string) => {
    switch (resultado) {
      case 'SUCESSO':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'ERRO':
        return <Badge variant="destructive">Erro</Badge>;
      case 'BLOQUEIO':
        return <Badge variant="destructive">Bloqueio</Badge>;
      case 'ALERTA':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Alerta</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (loading && !resultado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Validações Automáticas</span>
          </CardTitle>
          <CardDescription>
            Executando validações automáticas...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Validações Automáticas</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={executarValidacoes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Validando...' : 'Revalidar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowHistorico(!showHistorico);
                if (!showHistorico && historico.length === 0) {
                  carregarHistorico();
                }
              }}
            >
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={executarDebug}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
              Debug
            </Button>
          </div>
        </div>
        <CardDescription>
          {resultado ? (
            resultado.valida ? (
              <span className="text-green-600">✓ Todas as validações foram aprovadas</span>
            ) : (
              <span className="text-red-600">✗ Algumas validações falharam</span>
            )
          ) : (
            'Status das validações automáticas'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resultado && (
          <>
            {/* Resumo das validações */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Aprovadas</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {resultado.execucoes.filter(e => e.resultado === 'SUCESSO').length}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Falharam</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {resultado.execucoes.filter(e => e.resultado === 'ERRO' || e.resultado === 'BLOQUEIO').length}
                </div>
              </div>
            </div>

            {/* Lista de validações */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Validações Executadas</h4>
              {resultado.execucoes.map((execucao, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execucao.resultado)}
                    <div>
                      <div className="font-medium text-sm">{execucao.regra_nome}</div>
                      <div className="text-xs text-gray-500">{execucao.mensagem}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(execucao.resultado)}
                    <span className="text-xs text-gray-400">
                      {execucao.tempo_execucao}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Correções necessárias */}
            {resultado.correcoes_necessarias.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Correções Necessárias ({resultado.correcoes_necessarias.length})
                </h4>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <ul className="space-y-1">
                    {resultado.correcoes_necessarias.map((correcao, index) => (
                      <li key={index} className="text-sm text-red-800 flex items-start space-x-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{correcao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Alertas */}
            {resultado.alertas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Alertas ({resultado.alertas.length})
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <ul className="space-y-1">
                    {resultado.alertas.map((alerta, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start space-x-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{alerta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Histórico */}
        {showHistorico && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Histórico de Validações</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {historico.length > 0 ? (
                historico.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.resultado)}
                      <span>{item.regra?.nome || 'Regra desconhecida'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.resultado)}
                      <span className="text-gray-400">
                        {new Date(item.criado_em).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  Nenhum histórico encontrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {showDebug && debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Informações de Debug</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(false)}
              >
                Fechar
              </Button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <strong>OS:</strong> {debugInfo.os?.numero} ({debugInfo.os?.status})
              </div>
              
              <div>
                <strong>Regras Ativas:</strong> {debugInfo.resumo?.regras_ativas} de {debugInfo.resumo?.total_regras}
              </div>
              
              <div>
                <strong>Validações:</strong> {debugInfo.resumo?.valida ? '✅ Aprovada' : '❌ Falhou'} 
                ({debugInfo.resumo?.correcoes_necessarias} correções, {debugInfo.resumo?.alertas} alertas)
              </div>
              
              <div>
                <strong>Materiais:</strong> {debugInfo.resumo?.materiais_suficientes} suficientes, 
                {debugInfo.resumo?.materiais_insuficientes} insuficientes
              </div>
              
              {debugInfo.detalhes_estoque && debugInfo.detalhes_estoque.length > 0 && (
                <div>
                  <strong>Detalhes do Estoque:</strong>
                  <div className="mt-2 space-y-1">
                    {debugInfo.detalhes_estoque.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="truncate max-w-xs">{item.nome}</span>
                        <span className={`ml-2 ${item.suficiente ? 'text-green-600' : 'text-red-600'}`}>
                          {item.estoque_disponivel}/{item.quantidade_necessaria}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
