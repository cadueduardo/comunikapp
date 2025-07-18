'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Versao {
  id: string;
  numero_versao: number;
  observacoes?: string;
  criado_em: string;
  usuario?: {
    id: string;
    nome_completo: string;
    email: string;
  };
}

interface HistoricoVersoesProps {
  orcamentoId: string;
  onVersaoSelecionada?: (versao: Versao) => void;
}

export function HistoricoVersoes({ orcamentoId, onVersaoSelecionada }: HistoricoVersoesProps) {
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarVersoes();
  }, [orcamentoId]);

  const carregarVersoes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/orcamentos/${orcamentoId}/versoes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVersoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
      toast.error('Erro ao carregar histórico de versões');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Histórico de Versões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500">Carregando versões...</div>
        ) : versoes.length === 0 ? (
          <div className="text-center text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Nenhuma versão criada ainda</p>
            <p className="text-sm text-gray-400">As versões aparecerão aqui quando o orçamento for editado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versoes.map((versao) => (
              <div
                key={versao.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onVersaoSelecionada?.(versao)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Versão {versao.numero_versao}
                    </Badge>
                    {versao.usuario && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {versao.usuario.nome_completo}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatarData(versao.criado_em)}
                  </span>
                </div>
                
                {versao.observacoes && (
                  <p className="text-sm text-gray-700 mt-2">
                    {versao.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 