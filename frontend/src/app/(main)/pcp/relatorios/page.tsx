'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconChartBar,
  IconRefresh,
  IconClock,
  IconBuildingFactory,
} from '@tabler/icons-react';
import { pcpApi } from '@/lib/api-client';
import Link from 'next/link';

interface MaquinaOcupacao {
  maquina_id: string;
  nome: string;
  setor?: { id: string; nome: string } | null;
  setor_nome?: string;
  horas_disponiveis: number;
  horas_programadas: number;
  horas_livres: number;
  ocupacao_percent: number;
  status_carga: string;
}

interface CapacidadeMaquinasResponse {
  maquinas: MaquinaOcupacao[];
  sem_maquina?: { itens: unknown[]; horas_programadas: number };
  gerado_em?: string;
}

interface ItemPrevistoRealizado {
  id: string;
  os_numero: string;
  os_titulo: string;
  setor_nome: string;
  item_descricao: string | null;
  status: string;
  tempo_previsto_min: number;
  tempo_realizado_min: number;
  desvio_min: number;
  desvio_percent: number | null;
}

interface PrevistoRealizadoResponse {
  resumo: {
    total_itens: number;
    tempo_previsto_min: number;
    tempo_realizado_min: number;
    desvio_min: number;
    desvio_percent: number | null;
  };
  por_setor: Array<{
    setor_nome: string;
    itens: number;
    previsto_min: number;
    realizado_min: number;
    desvio_percent: number | null;
  }>;
  itens: ItemPrevistoRealizado[];
}

function minutosParaHoras(min: number): string {
  if (min <= 0) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function badgeCarga(status: string) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    normal: 'secondary',
    atencao: 'outline',
    cheia: 'default',
    sobrecarregada: 'destructive',
  };
  const labels: Record<string, string> = {
    normal: 'Normal',
    atencao: 'Atenção',
    cheia: 'Cheia',
    sobrecarregada: 'Sobrecarregada',
  };
  return (
    <Badge variant={map[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default function RelatoriosPage() {
  const [maquinas, setMaquinas] = useState<MaquinaOcupacao[]>([]);
  const [previsto, setPrevisto] = useState<PrevistoRealizadoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Sessão expirada');

      const [ocupacao, comparativo] = await Promise.all([
        pcpApi.getOcupacaoMaquinasRelatorio(token) as Promise<CapacidadeMaquinasResponse>,
        pcpApi.getPrevistoRealizado(token, { limite: '80' }) as Promise<PrevistoRealizadoResponse>,
      ]);

      setMaquinas(ocupacao.maquinas ?? []);
      setPrevisto(comparativo);
    } catch (e) {
      console.error(e);
      setErro('Não foi possível carregar os relatórios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = previsto?.resumo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios PCP
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ocupação por máquina e comparativo previsto × realizado
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pcp">
            <Button variant="outline">Voltar ao PCP</Button>
          </Link>
          <Button onClick={() => void carregar()} disabled={loading}>
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {erro && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">{erro}</CardContent>
        </Card>
      )}

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Itens analisados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.total_itens}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <IconClock className="h-4 w-4" /> Tempo previsto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {minutosParaHoras(resumo.tempo_previsto_min)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tempo realizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {minutosParaHoras(resumo.tempo_realizado_min)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Desvio total</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  resumo.desvio_min > 0 ? 'text-amber-600' : 'text-green-600'
                }`}
              >
                {resumo.desvio_percent != null
                  ? `${resumo.desvio_percent > 0 ? '+' : ''}${resumo.desvio_percent}%`
                  : minutosParaHoras(resumo.desvio_min)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuildingFactory className="h-5 w-5" />
            Ocupação por máquina
          </CardTitle>
          <CardDescription>
            Horas programadas vs capacidade diária (máquinas ativas no PCP)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : maquinas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma máquina com PCP ativo. Cadastre horas/dia e marque &quot;Usar no PCP&quot;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Máquina</th>
                    <th className="py-2 pr-4">Setor</th>
                    <th className="py-2 pr-4">Programado</th>
                    <th className="py-2 pr-4">Disponível</th>
                    <th className="py-2 pr-4">Ocupação</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maquinas.map((m) => (
                    <tr key={m.maquina_id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{m.nome}</td>
                      <td className="py-2 pr-4">{m.setor?.nome ?? m.setor_nome ?? '—'}</td>
                      <td className="py-2 pr-4">{m.horas_programadas.toFixed(1)} h</td>
                      <td className="py-2 pr-4">{m.horas_disponiveis.toFixed(1)} h</td>
                      <td className="py-2 pr-4">{m.ocupacao_percent.toFixed(0)}%</td>
                      <td className="py-2">{badgeCarga(m.status_carga)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5" />
              Previsto × realizado por setor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!previsto?.por_setor?.length ? (
              <p className="text-sm text-muted-foreground">
                Sem dados com tempo previsto ou realizado registrado.
              </p>
            ) : (
              previsto.por_setor.map((s) => (
                <div key={s.setor_nome} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <div className="font-medium">{s.setor_nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.itens} itens · prev. {minutosParaHoras(s.previsto_min)} · real.{' '}
                      {minutosParaHoras(s.realizado_min)}
                    </div>
                  </div>
                  {s.desvio_percent != null && (
                    <span
                      className={
                        s.desvio_percent > 10
                          ? 'text-amber-600 font-medium'
                          : 'text-muted-foreground'
                      }
                    >
                      {s.desvio_percent > 0 ? '+' : ''}
                      {s.desvio_percent}%
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos itens com desvio</CardTitle>
            <CardDescription>Baseado em tempo estimado e tempo real do setor na OS</CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto space-y-2 text-sm">
            {!previsto?.itens?.length ? (
              <p className="text-muted-foreground">Nenhum registro.</p>
            ) : (
              previsto.itens
                .filter((i) => i.tempo_realizado_min > 0 || i.tempo_previsto_min > 0)
                .slice(0, 15)
                .map((i) => (
                  <div key={i.id} className="border-b pb-2">
                    <div className="font-medium">
                      OS {i.os_numero} · {i.setor_nome}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {i.item_descricao || i.os_titulo}
                    </div>
                    <div className="text-xs mt-1">
                      Prev. {minutosParaHoras(i.tempo_previsto_min)} → Real.{' '}
                      {minutosParaHoras(i.tempo_realizado_min)}
                      {i.desvio_percent != null && (
                        <span className="ml-2">
                          ({i.desvio_percent > 0 ? '+' : ''}
                          {i.desvio_percent}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
