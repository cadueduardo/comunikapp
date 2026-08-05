'use client';
import { getClientSessionToken } from '@/lib/session-auth';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  Edit,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiClient, clientesApi, type ClienteDetalheApi } from '@/lib/api-client';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  filtrarOrcamentosPorGrupo,
  rotuloStatusOrcamento,
  rotuloStatusOS,
  type FiltroHistoricoOrcamento,
} from '@/lib/cliente-historico';
import type { OrdemServico } from '@/app/(main)/os/columns';
import { useDuplicarOrcamento } from '@/hooks/use-duplicar-orcamento';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { TransferirCarteiraDialog } from '@/components/clientes/TransferirCarteiraDialog';
import { ParticipantesCarteiraPanel } from '@/components/clientes/ParticipantesCarteiraPanel';

interface OrcamentoHistorico {
  id: string;
  numero?: string;
  titulo?: string;
  nome_servico?: string;
  status?: string;
  preco_final?: number | string;
  data_criacao?: string;
  criado_em?: string;
}

function statusClienteClass(status: string) {
  switch (status) {
    case 'ATIVO':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'PROSPECT':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200';
    case 'BLOQUEADO':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function tituloOrcamento(o: OrcamentoHistorico) {
  return o.nome_servico || o.titulo || 'Sem título';
}

interface ClienteFichaProps {
  clienteId: string;
}

export function ClienteFicha({ clienteId }: ClienteFichaProps) {
  const router = useRouter();
  const { acesso } = useVendasAcesso(true);
  const [cliente, setCliente] = useState<ClienteDetalheApi | null>(null);
  const [orcamentos, setOrcamentos] = useState<OrcamentoHistorico[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroOrcamento, setFiltroOrcamento] =
    useState<FiltroHistoricoOrcamento>('todos');
  const [transferirOpen, setTransferirOpen] = useState(false);
  const { duplicar, isDuplicando } = useDuplicarOrcamento();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [clienteData, orcamentosRes, osRes] = await Promise.all([
        clientesApi.getById(clienteId, token),
        ApiClient.get<{ orcamentos?: OrcamentoHistorico[] } | OrcamentoHistorico[]>(
          `/orcamentos-v2?cliente_id=${encodeURIComponent(clienteId)}&porPagina=100`,
          token,
        ),
        apiRequest(
          `/os?cliente_id=${encodeURIComponent(clienteId)}&limit=100&page=1`,
        ),
      ]);

      setCliente(clienteData);

      const listaOrc = Array.isArray(orcamentosRes)
        ? orcamentosRes
        : orcamentosRes.orcamentos ?? [];
      setOrcamentos(listaOrc);

      if (osRes.ok) {
        const osJson = await osRes.json();
        setOrdens(osJson.data ?? []);
      } else {
        setOrdens([]);
      }
    } catch {
      toast.error('Erro ao carregar ficha do cliente');
      setCliente(null);
    } finally {
      setLoading(false);
    }
  }, [clienteId, router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const orcamentosFiltrados = useMemo(
    () => filtrarOrcamentosPorGrupo(orcamentos, filtroOrcamento),
    [orcamentos, filtroOrcamento],
  );

  const resumo = useMemo(() => {
    const abertos = filtrarOrcamentosPorGrupo(orcamentos, 'abertos').length;
    const aprovados = filtrarOrcamentosPorGrupo(orcamentos, 'aprovados').length;
    const osAtivas = ordens.filter((o) => o.status !== 'FINALIZADA' && o.status !== 'CANCELADA').length;
    return { abertos, aprovados, osTotal: ordens.length, osAtivas };
  }, [orcamentos, ordens]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando ficha do cliente...
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/clientes">Voltar para clientes</Link>
        </Button>
      </div>
    );
  }

  const novoOrcamentoHref = `/orcamentos-v2/novo?cliente_id=${cliente.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Clientes
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {cliente.nome}
              </h1>
              <Badge className={statusClienteClass(cliente.status_cliente)}>
                {cliente.status_cliente}
              </Badge>
              <Badge variant="outline">
                {cliente.tipo_pessoa === 'PESSOA_FISICA' ? 'P. Física' : 'P. Jurídica'}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {cliente.documento}
              </span>
              {cliente.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {cliente.email}
                </span>
              )}
              {(cliente.telefone || cliente.whatsapp) && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {cliente.telefone || cliente.whatsapp}
                </span>
              )}
              {cliente.cidade && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {cliente.cidade}
                  {cliente.estado ? `/${cliente.estado}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {acesso.permissoes.cliente_editar ? (
            <Button variant="outline" asChild>
              <Link href={`/clientes/editar/${cliente.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar cadastro
              </Link>
            </Button>
          ) : null}
          {acesso.permissoes.carteira_transferir ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferirOpen(true)}
            >
              Transferir carteira
            </Button>
          ) : null}
          <Button asChild>
            <Link href={novoOrcamentoHref}>
              <Plus className="mr-2 h-4 w-4" />
              Novo orçamento
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Responsável comercial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-foreground">
              {cliente.responsavel_comercial?.nome ?? 'Sem responsável'}
            </p>
            <p className="text-muted-foreground">
              Desde {formatarData(cliente.responsavel_desde)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vendedor da carteira — distinto do contato interno do cliente.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contato no cliente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-foreground">
              {cliente.responsavel?.trim() || '—'}
            </p>
            <p className="text-muted-foreground">
              {cliente.cargo_responsavel?.trim() || 'Sem cargo informado'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Pessoa de referência dentro do cliente (campo legado `responsavel`).
            </p>
          </CardContent>
        </Card>
      </div>

      <ParticipantesCarteiraPanel
        clienteId={cliente.id}
        responsavelComercialId={cliente.responsavel_comercial_id}
        participantes={cliente.participantes ?? []}
        podeAdministrar={Boolean(acesso.permissoes.carteira_transferir)}
        onChanged={() => void carregar()}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Orçamentos abertos</p>
            <p className="text-2xl font-semibold">{resumo.abertos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Orçamentos aprovados</p>
            <p className="text-2xl font-semibold">{resumo.aprovados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ordens de serviço</p>
            <p className="text-2xl font-semibold">{resumo.osTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">OS em andamento</p>
            <p className="text-2xl font-semibold">{resumo.osAtivas}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orcamentos" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="orcamentos" className="gap-2">
            <FileText className="h-4 w-4" />
            Orçamentos ({orcamentos.length})
          </TabsTrigger>
          <TabsTrigger value="os" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Ordens de serviço ({ordens.length})
          </TabsTrigger>
          <TabsTrigger value="contatos" className="gap-2">
            Contatos ({cliente.contatos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="transferencias" className="gap-2">
            Transferências ({cliente.transferencias_carteira?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="space-y-3">
          {(cliente.contatos?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum contato cadastrado. Use a API de contatos ou o formulário
                futuro de gestão (permissão `contato.gerenciar`).
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {cliente.contatos.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {c.nome}
                      {c.principal ? (
                        <Badge className="ml-2" variant="secondary">
                          Principal
                        </Badge>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {c.cargo ? <p>{c.cargo}</p> : null}
                    {c.email ? <p>{c.email}</p> : null}
                    {c.telefone || c.whatsapp ? (
                      <p>{c.telefone || c.whatsapp}</p>
                    ) : null}
                    <p className="text-xs">
                      Papéis: {(c.papeis ?? []).join(', ') || '—'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transferencias" className="space-y-3">
          {(cliente.transferencias_carteira?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma transferência registrada para este cliente.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {cliente.transferencias_carteira?.map((t) => (
                <li key={t.id}>
                  <Card>
                    <CardContent className="space-y-1 py-4 text-sm">
                      <p className="font-medium text-foreground">
                        {(t.de_usuario?.nome ?? 'Sem responsável')} →{' '}
                        {t.para_usuario.nome}
                      </p>
                      <p className="text-muted-foreground">{t.motivo}</p>
                      <p className="text-xs text-muted-foreground">
                        Por {t.autor.nome} em {formatarData(t.criado_em)}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="orcamentos" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['todos', 'Todos'],
                ['abertos', 'Abertos'],
                ['aprovados', 'Aprovados'],
                ['encerrados', 'Encerrados'],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={filtroOrcamento === key ? 'default' : 'outline'}
                onClick={() => setFiltroOrcamento(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {orcamentosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum orçamento neste filtro.
                <div className="mt-4">
                  <Button size="sm" asChild>
                    <Link href={novoOrcamentoHref}>Criar orçamento</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {orcamentosFiltrados.map((orc) => {
                const href = `/orcamentos-v2/novo?id=${orc.id}`;

                return (
                  <Card key={orc.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {orc.numero ? `#${orc.numero}` : 'Orçamento'}
                          </span>
                          <Badge variant="outline">{rotuloStatusOrcamento(orc.status)}</Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {tituloOrcamento(orc)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(orc.data_criacao ?? orc.criado_em)}
                          {orc.preco_final != null && (
                            <>
                              {' · '}
                              {formatCurrency(Number(orc.preco_final) || 0)}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={href}>Abrir</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDuplicando(orc.id)}
                          onClick={() =>
                            void duplicar(orc.id, { onSuccess: () => carregar() })
                          }
                        >
                          {isDuplicando(orc.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          Duplicar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="os" className="space-y-4">
          {ordens.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma ordem de serviço para este cliente.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {ordens.map((os) => (
                <Card key={os.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">OS {os.numero}</span>
                        <Badge variant="outline">{rotuloStatusOS(os.status)}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {os.nome_servico}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Abertura: {formatarData(os.data_abertura ?? os.criado_em)}
                        {os.orcamento_id && (
                          <>
                            {' · '}
                            <Link
                              href={`/orcamentos-v2/novo?id=${os.orcamento_id}`}
                              className="text-primary hover:underline"
                            >
                              Ver orçamento origem
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link href={`/os/${os.id}`}>Abrir OS</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {cliente.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {cliente.observacoes}
            </p>
          </CardContent>
        </Card>
      )}

      <TransferirCarteiraDialog
        open={transferirOpen}
        cliente={cliente}
        onClose={() => setTransferirOpen(false)}
        onSuccess={() => {
          setTransferirOpen(false);
          void carregar();
        }}
      />
    </div>
  );
}
