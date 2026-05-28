'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { CheckCircle2, Columns3, Gauge, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type NivelPCP = 'ESSENCIAL' | 'ORGANIZADO' | 'COMPLETO';

interface OpcaoPCP {
  nivel: NivelPCP;
  titulo: string;
  indicado: string;
  descricao: string;
  itens: string[];
  icon: React.ReactNode;
}

const opcoes: OpcaoPCP[] = [
  {
    nivel: 'ESSENCIAL',
    titulo: 'Essencial',
    indicado: 'Equipe enxuta',
    descricao: 'Para empresas em que a mesma pessoa planeja, opera máquina e entrega.',
    itens: ['Fila clara de OS', 'Status simples', 'Sem obrigar apontamento detalhado'],
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    nivel: 'ORGANIZADO',
    titulo: 'Organizado',
    indicado: 'Pequena equipe',
    descricao: 'Para separar etapas comuns sem transformar o PCP em burocracia.',
    itens: ['Pré-produção', 'Produção', 'Acabamento', 'Pronto para entrega'],
    icon: <Columns3 className="h-5 w-5" />,
  },
  {
    nivel: 'COMPLETO',
    titulo: 'Completo',
    indicado: 'Operação com setores',
    descricao: 'Para controlar setor, operador, pausas, apontamentos e gargalos.',
    itens: ['Setores produtivos', 'Operadores', 'Apontamentos', 'Indicadores'],
    icon: <Layers3 className="h-5 w-5" />,
  },
];

export default function ConfiguracaoPCPPage() {
  const [nivelAtual, setNivelAtual] = useState<NivelPCP | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<NivelPCP | null>(null);

  useEffect(() => {
    carregarConfiguracao().catch((error) => {
      console.error(error);
      toast.error('Não foi possível carregar a configuração do PCP.');
    });
  }, []);

  async function carregarConfiguracao() {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/configuracao', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Falha ao carregar configuração');
      const data = await response.json();
      setNivelAtual(data.nivel ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function salvarNivel(nivel: NivelPCP) {
    setSalvando(nivel);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/pcp/configuracao', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nivel }),
      });

      if (!response.ok) throw new Error('Falha ao salvar configuração');
      const data = await response.json();
      setNivelAtual(data.nivel);
      toast.success('Configuração do PCP salva.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar a configuração do PCP.');
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuração do PCP</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o nível de controle produtivo adequado para a operação atual.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {opcoes.map((opcao) => {
          const selecionado = nivelAtual === opcao.nivel;
          return (
            <Card key={opcao.nivel} className={selecionado ? 'border-blue-500 ring-1 ring-blue-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md border p-2 text-blue-700">{opcao.icon}</div>
                    <div>
                      <CardTitle className="text-base">{opcao.titulo}</CardTitle>
                      <CardDescription>{opcao.indicado}</CardDescription>
                    </div>
                  </div>
                  {selecionado && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{opcao.descricao}</p>
                <ul className="space-y-2 text-sm">
                  {opcao.itens.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={selecionado ? 'secondary' : 'default'}
                  disabled={loading || salvando !== null}
                  onClick={() => salvarNivel(opcao.nivel)}
                >
                  {salvando === opcao.nivel
                    ? 'Salvando...'
                    : selecionado
                      ? 'Selecionado'
                      : 'Escolher'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
