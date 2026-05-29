'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CircleDollarSign,
  Hourglass,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useResumoFinanceiro } from '@/hooks/use-home-operacional';
import { useUser } from '@/contexts/UserContext';
import { financeIndicatorThemes } from '@/lib/theme-surfaces';

/**
 * Bloco 4 do dashboard - Resumo Financeiro Simples (Fase 6.C).
 *
 * Decisao Fase 0 (doc 07-permissoes-home.md):
 * - So renderiza quando o usuario tem permissao
 *   `home-operacional.ver_resumo_financeiro`.
 * - Enquanto o sistema de perfis nao esta populado (ver TODO no backend),
 *   usamos como proxy `usuario.funcao` alinhado ao enum oficial
 *   `usuario_funcao` em backend/prisma/schema.prisma:
 *     { ADMINISTRADOR, FINANCEIRO, PRODUCAO, VENDAS, ESTOQUE }
 *   Hoje apenas ADMINISTRADOR e FINANCEIRO veem o bloco.
 *
 * Cada indicador e clicavel quando faz sentido (decisao do produto: cada
 * indicador leva a listagem ou tela correspondente).
 *
 * Indicadores com valor `null` sao OCULTADOS (regra: nao inventar projecao).
 */
const FUNCOES_COM_VISAO_FINANCEIRA = new Set(['ADMINISTRADOR', 'FINANCEIRO']);

export function ResumoFinanceiroSimples() {
  const { user } = useUser();
  const { resumo, loading, erro } = useResumoFinanceiro();

  // Permissao visivel: esconde o bloco inteiro se usuario nao tem acesso.
  const funcaoUpper = String(user?.funcao ?? '').toUpperCase();
  if (!user || !FUNCOES_COM_VISAO_FINANCEIRA.has(funcaoUpper)) {
    return null;
  }

  if (loading && !resumo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[90px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Falha ao carregar: {erro}</p>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) return null;

  const d = resumo.data;

  // Monta a lista de indicadores condicionalmente.
  type Indicador = {
    id: string;
    label: string;
    valor: number;
    icone: React.ReactNode;
    cor: 'blue' | 'emerald' | 'amber' | 'zinc' | 'red' | 'violet';
    href?: string;
    hint?: string;
  };

  const indicadores: Indicador[] = [];

  if (d.total_orcado_mes != null) {
    indicadores.push({
      id: 'orcado',
      label: 'Orcado no mes',
      valor: d.total_orcado_mes,
      icone: <Receipt className="h-4 w-4" />,
      cor: 'blue',
      href: '/orcamentos-v2',
      hint: 'Soma de orcamentos criados',
    });
  }
  if (d.total_aprovado_mes != null) {
    indicadores.push({
      id: 'aprovado',
      label: 'Aprovado no mes',
      valor: d.total_aprovado_mes,
      icone: <TrendingUp className="h-4 w-4" />,
      cor: 'emerald',
      href: '/orcamentos-v2?status=aprovado',
      hint: 'Orcamentos com OS gerada',
    });
  }
  if (d.valor_em_producao != null) {
    indicadores.push({
      id: 'producao',
      label: 'Em producao',
      valor: d.valor_em_producao,
      icone: <Hourglass className="h-4 w-4" />,
      cor: 'amber',
      href: '/os',
      hint: 'Saldo de cobrancas em OS ativa',
    });
  }
  if (d.valor_pronto_a_receber != null) {
    indicadores.push({
      id: 'a_receber',
      label: 'Pronto a receber',
      valor: d.valor_pronto_a_receber,
      icone: <PiggyBank className="h-4 w-4" />,
      cor: 'violet',
      href: '/financeiro/recebimentos',
      hint: 'OS finalizada com saldo',
    });
  }
  if (d.valor_recebido_mes != null) {
    indicadores.push({
      id: 'recebido',
      label: 'Recebido no mes',
      valor: d.valor_recebido_mes,
      icone: <Wallet className="h-4 w-4" />,
      cor: 'emerald',
      href: '/financeiro/recebimentos',
      hint: `Periodo: ${d.periodo}`,
    });
  }
  if (d.cobrancas_vencidas > 0) {
    indicadores.push({
      id: 'vencidas',
      label: `Vencidas (${d.cobrancas_vencidas})`,
      valor: d.valor_vencido,
      icone: <CircleDollarSign className="h-4 w-4" />,
      cor: 'red',
      href: '/financeiro/recebimentos?status=VENCIDO',
      hint: 'Acao requerida',
    });
  }

  // Se nao tem nenhum indicador (loja sem dados), mostra estado vazio amigavel.
  if (indicadores.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum dado financeiro no periodo. Aprove orcamentos para gerar
            cobrancas e acompanhar valores aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Resumo financeiro</CardTitle>
        <span className="text-xs text-muted-foreground">
          {resumo.meta.cached ? 'cache 60s' : 'atualizado agora'}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {indicadores.map((ind) => (
            <IndicadorCard key={ind.id} indicador={ind} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------------
// Card individual
// -------------------------------------------------------------------

function formatarMoeda(valor: number): string {
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `R$ ${valor.toFixed(2)}`;
  }
}

interface IndicadorCardProps {
  indicador: {
    id: string;
    label: string;
    valor: number;
    icone: React.ReactNode;
    cor: 'blue' | 'emerald' | 'amber' | 'zinc' | 'red' | 'violet';
    href?: string;
    hint?: string;
  };
}

function IndicadorCard({ indicador }: IndicadorCardProps) {
  const tema = financeIndicatorThemes[indicador.cor];

  const conteudo = (
    <div
      className={`rounded-md border p-3 h-full flex flex-col gap-1 transition-shadow ${tema.borda} ${tema.fundo} ${
        indicador.href ? 'hover:shadow-sm cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">
          {indicador.label}
        </span>
        <span className={tema.iconeFg}>{indicador.icone}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${tema.valorFg}`}>
        {formatarMoeda(indicador.valor)}
      </p>
      {indicador.hint && (
        <p className="text-[10px] text-muted-foreground/80">
          {indicador.hint}
        </p>
      )}
      {indicador.href && (
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 mt-auto">
          Abrir
          <ArrowUpRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  if (indicador.href) {
    return (
      <Link
        href={indicador.href}
        className="group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        {conteudo}
      </Link>
    );
  }
  return conteudo;
}
