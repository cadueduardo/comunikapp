'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  GeometriaCalculada,
  GeometriaValor,
  QuickGeometryInput,
} from '@/components/orcamentos-v2/QuickGeometryInput';
import { SimuladorPrecificacao } from '@/components/orcamentos-v2/SimuladorPrecificacao';
import {
  ResultadoEstimativaMaquina,
  postEstimarTempoMaquina,
} from '@/lib/estimativa-tempo-api';
import { apiRequest } from '@/lib/api';
import { orcamentosModuleNav } from '@/lib/module-nav';

interface MaquinaLite {
  id: string;
  nome: string;
  tipo: string;
  modo_producao?: 'M2_H' | 'ML_H' | 'MANUAL';
}

export default function SimuladorOrcamentoV2Page() {
  const [geometriaValor, setGeometriaValor] = useState<GeometriaValor>({
    largura: '1000',
    altura: '500',
    unidade: 'mm',
  });
  const [calculada, setCalculada] = useState<GeometriaCalculada | null>(null);
  const [quantidade, setQuantidade] = useState<string>('1');

  const [maquinas, setMaquinas] = useState<MaquinaLite[]>([]);
  const [carregandoMaquinas, setCarregandoMaquinas] = useState(false);
  const [maquinaSelecionada, setMaquinaSelecionada] = useState<string>('');
  const [estimativa, setEstimativa] = useState<ResultadoEstimativaMaquina | null>(null);
  const [estimando, setEstimando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregandoMaquinas(true);
    apiRequest('/maquinas', { method: 'GET' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Falha ao carregar máquinas');
        const data = await r.json();
        if (cancelado) return;
        const lista: MaquinaLite[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setMaquinas(lista);
      })
      .catch((err) => {
        if (!cancelado) toast.error(err?.message || 'Falha ao carregar máquinas');
      })
      .finally(() => {
        if (!cancelado) setCarregandoMaquinas(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function estimarTempoAtual() {
    if (!maquinaSelecionada) {
      toast.error('Selecione uma máquina.');
      return;
    }
    if (!calculada) {
      toast.error('Preencha a geometria antes de estimar.');
      return;
    }
    const qtd = Number(String(quantidade).replace(',', '.'));
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }

    setEstimando(true);
    try {
      const resultado = await postEstimarTempoMaquina({
        maquina_id: maquinaSelecionada,
        quantidade: qtd,
        area_m2: calculada.area_m2,
        perimetro_mm: calculada.perimetro_mm,
      });
      setEstimativa(resultado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao estimar tempo.');
      setEstimativa(null);
    } finally {
      setEstimando(false);
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6">
        <ModuleHeader
          nav={orcamentosModuleNav}
          title="Simulador de precificação e produção"
          subtitle="Ferramentas de apoio: geometria rápida, estimativa de tempo de máquina e simulador de precificação. Não cria orçamento."
          backHref="/orcamentos-v2"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <QuickGeometryInput
            valor={geometriaValor}
            onChange={(novo, calc) => {
              setGeometriaValor(novo);
              setCalculada(calc);
            }}
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sim-qtd" className="text-xs">
                Quantidade
              </Label>
              <Input
                id="sim-qtd"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sim-maq" className="text-xs">
                Máquina
              </Label>
              <select
                id="sim-maq"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={maquinaSelecionada}
                onChange={(e) => setMaquinaSelecionada(e.target.value)}
                disabled={carregandoMaquinas}
              >
                <option value="">
                  {carregandoMaquinas ? 'Carregando…' : 'Selecione…'}
                </option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.tipo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={estimarTempoAtual}
              disabled={estimando || !maquinaSelecionada || !calculada}
            >
              {estimando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Estimar tempo
            </Button>
          </div>

          {estimativa && (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-gray-500">
                    Tempo estimado · {estimativa.maquina_nome}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {estimativa.tempo_horas.toLocaleString('pt-BR', {
                      maximumFractionDigits: 2,
                    })}{' '}
                    h
                  </div>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    estimativa.estimativa_possivel
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {estimativa.detalhamento.modo_producao}
                </span>
              </div>

              <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                {estimativa.detalhamento.velocidade_usada && (
                  <li>
                    Velocidade usada:{' '}
                    {estimativa.detalhamento.velocidade_usada}{' '}
                    {estimativa.detalhamento.unidade_velocidade}
                  </li>
                )}
                <li>
                  Setup: {estimativa.detalhamento.setup_horas} h | Eficiência:{' '}
                  {estimativa.detalhamento.eficiencia_percent ?? '—'}%
                </li>
                <li>
                  Bruto: {estimativa.detalhamento.tempo_bruto_horas} h | Com
                  eficiência:{' '}
                  {estimativa.detalhamento.tempo_com_eficiencia_horas} h
                </li>
                {estimativa.detalhamento.mensagens.map((m, i) => (
                  <li key={i} className="text-amber-700">
                    • {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <SimuladorPrecificacao />
      </div>
    </div>
  );
}
