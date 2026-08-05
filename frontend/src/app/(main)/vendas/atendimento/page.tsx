'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';
import { getClientSessionToken } from '@/lib/session-auth';
import {
  clientesApi,
  type ClienteApi,
  type ClienteContatoApi,
} from '@/lib/api-client';

type ModoCliente = 'existente' | 'prospect';

type FormState = {
  modo: ModoCliente;
  cliente_id: string;
  cliente_nome: string;
  contato_id: string;
  nome: string;
  telefone: string;
  email: string;
  documento: string;
  necessidade: string;
  descricao: string;
  origem: string;
  prazo: string;
  prazo_desejado: string;
  criar_orcamento: boolean;
  chave_operacao: string;
};

const ORIGENS = [
  { value: 'telefone', label: 'Telefone' },
  { value: 'whatsapp_manual', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'outro', label: 'Outro' },
];

function prazoDefaultIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function NovoAtendimentoPage() {
  const router = useRouter();
  const { acesso } = useVendasAcesso(true);
  const { nav } = useVendasNavFiltrado();
  const [form, setForm] = useState<FormState>({
    modo: 'existente',
    cliente_id: '',
    cliente_nome: '',
    contato_id: '',
    nome: '',
    telefone: '',
    email: '',
    documento: '',
    necessidade: '',
    descricao: '',
    origem: 'telefone',
    prazo: prazoDefaultIso(),
    prazo_desejado: '',
    criar_orcamento: true,
    chave_operacao: crypto.randomUUID(),
  });
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ClienteApi[]>([]);
  const [contatos, setContatos] = useState<ClienteContatoApi[]>([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);

  const update = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const podeProspect = acesso.permissoes.cliente_criar === true;
  const podeAtender = acesso.permissoes.atividade_gerenciar === true;

  useEffect(() => {
    if (form.modo !== 'existente') return;
    const q = busca.trim();
    if (q.length < 2) {
      setResultados([]);
      return;
    }

    let cancelado = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const token = getClientSessionToken();
        if (!token) return;
        setBuscando(true);
        try {
          const lista = await clientesApi.search(q, token);
          if (!cancelado) setResultados(Array.isArray(lista) ? lista : []);
        } catch {
          if (!cancelado) {
            setResultados([]);
            toast.error('Não foi possível buscar clientes da carteira.');
          }
        } finally {
          if (!cancelado) setBuscando(false);
        }
      })();
    }, 300);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [busca, form.modo]);

  useEffect(() => {
    if (!form.cliente_id) {
      setContatos([]);
      return;
    }
    let cancelado = false;
    void (async () => {
      const token = getClientSessionToken();
      if (!token) return;
      setCarregandoContatos(true);
      try {
        const lista = await clientesApi.listarContatos(form.cliente_id, token);
        if (!cancelado) setContatos(Array.isArray(lista) ? lista : []);
      } catch {
        if (!cancelado) {
          setContatos([]);
          toast.error('Não foi possível carregar os contatos do cliente.');
        }
      } finally {
        if (!cancelado) setCarregandoContatos(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [form.cliente_id]);

  const selecionarCliente = useCallback(
    (cliente: ClienteApi) => {
      update({
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        contato_id: '',
      });
      setBusca(cliente.nome);
      setResultados([]);
    },
    [update],
  );

  const alternarModo = useCallback(
    (modo: ModoCliente) => {
      if (modo === 'prospect' && !podeProspect) {
        toast.error('Sem permissão para criar prospect.');
        return;
      }
      update({
        modo,
        cliente_id: '',
        cliente_nome: '',
        contato_id: '',
        nome: '',
        telefone: '',
        email: '',
        documento: '',
      });
      setBusca('');
      setResultados([]);
      setContatos([]);
    },
    [podeProspect, update],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!form.necessidade.trim() || !form.prazo) {
      toast.error('Preencha necessidade e prazo.');
      return;
    }

    if (form.modo === 'existente') {
      if (!form.cliente_id) {
        toast.error('Selecione um cliente da carteira autorizada.');
        return;
      }
    } else {
      if (!podeProspect) {
        toast.error('Sem permissão para criar prospect.');
        return;
      }
      if (!form.nome.trim()) {
        toast.error('Informe o nome do prospect.');
        return;
      }
    }

    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) {
        toast.error('Sessão inválida.');
        return;
      }

      const body =
        form.modo === 'existente'
          ? {
              chave_operacao: form.chave_operacao,
              cliente_id: form.cliente_id,
              contato_id: form.contato_id || undefined,
              necessidade: form.necessidade.trim(),
              descricao: form.descricao.trim() || undefined,
              origem: form.origem,
              prazo: new Date(form.prazo).toISOString(),
              prazo_desejado: form.prazo_desejado
                ? new Date(form.prazo_desejado).toISOString()
                : undefined,
              tipo_proxima_acao: 'demanda',
              criar_orcamento: form.criar_orcamento,
            }
          : {
              chave_operacao: form.chave_operacao,
              prospect: {
                nome: form.nome.trim(),
                telefone: form.telefone || undefined,
                email: form.email || undefined,
                documento: form.documento || undefined,
              },
              necessidade: form.necessidade.trim(),
              descricao: form.descricao.trim() || undefined,
              origem: form.origem,
              prazo: new Date(form.prazo).toISOString(),
              prazo_desejado: form.prazo_desejado
                ? new Date(form.prazo_desejado).toISOString()
                : undefined,
              tipo_proxima_acao: 'demanda',
              criar_orcamento: form.criar_orcamento,
            };

      const resp = await fetch('/api/vendas/atendimento', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        toast.error(
          typeof data?.message === 'string'
            ? data.message
            : 'Não foi possível registrar o atendimento.',
        );
        return;
      }

      toast.success('Atendimento registrado.');
      if (data?.deep_link) {
        router.push(data.deep_link);
        return;
      }
      if (data?.atividade_id) {
        router.push(`/vendas/atividades?id=${data.atividade_id}`);
        return;
      }
      router.push('/vendas/atividades');
    } catch {
      toast.error('Falha de rede ao registrar atendimento.');
    } finally {
      setLoading(false);
    }
  };

  const contatosAtivos = useMemo(
    () => contatos.filter((c) => c.ativo !== false),
    [contatos],
  );

  if (!acesso.pode_acessar_modulo || !podeAtender) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Sem acesso ao atendimento.</p>
        <Button variant="outline" asChild>
          <Link href="/vendas">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={nav}
        title="Novo atendimento"
        subtitle="Selecione um cliente da carteira ou crie um prospect; a demanda exige ATIVIDADE_GERENCIAR."
        backHref="/vendas"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Dados do atendimento
          </CardTitle>
          <CardDescription>
            Os dados digitados permanecem no formulário em caso de erro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={form.modo === 'existente' ? 'default' : 'outline'}
                onClick={() => alternarModo('existente')}
              >
                Cliente existente
              </Button>
              <Button
                type="button"
                variant={form.modo === 'prospect' ? 'default' : 'outline'}
                disabled={!podeProspect}
                onClick={() => alternarModo('prospect')}
                title={
                  podeProspect
                    ? undefined
                    : 'Requer permissão CLIENTE_CRIAR'
                }
              >
                Criar prospect
              </Button>
            </div>

            {form.modo === 'existente' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="busca-cliente">Buscar cliente da carteira</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca-cliente"
                      className="pl-9"
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value);
                        if (form.cliente_id) {
                          update({
                            cliente_id: '',
                            cliente_nome: '',
                            contato_id: '',
                          });
                        }
                      }}
                      placeholder="Digite ao menos 2 caracteres"
                      autoComplete="off"
                    />
                    {buscando ? (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                  {resultados.length > 0 ? (
                    <ul className="max-h-48 overflow-auto rounded-md border border-border bg-card">
                      {resultados.map((cliente) => (
                        <li key={cliente.id}>
                          <button
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
                            onClick={() => selecionarCliente(cliente)}
                          >
                            <span className="text-sm font-medium text-foreground">
                              {cliente.nome}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {[cliente.documento, cliente.telefone, cliente.email]
                                .filter(Boolean)
                                .join(' · ') || 'Sem documento/contato'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {form.cliente_id ? (
                    <p className="text-sm text-foreground">
                      Selecionado:{' '}
                      <span className="font-medium">{form.cliente_nome}</span>
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Contato (opcional)</Label>
                  <Select
                    value={form.contato_id || '__nenhum__'}
                    onValueChange={(v) =>
                      update({ contato_id: v === '__nenhum__' ? '' : v })
                    }
                    disabled={!form.cliente_id || carregandoContatos}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          carregandoContatos
                            ? 'Carregando contatos…'
                            : 'Sem contato específico'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__nenhum__">Sem contato específico</SelectItem>
                      {contatosAtivos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                          {c.principal ? ' (principal)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do prospect</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => update({ nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => update({ telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">Documento</Label>
                  <Input
                    id="documento"
                    value={form.documento}
                    onChange={(e) => update({ documento: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="necessidade">Necessidade / próxima ação</Label>
              <Input
                id="necessidade"
                value={form.necessidade}
                onChange={(e) => update({ necessidade: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Detalhe</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => update({ descricao: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select
                  value={form.origem}
                  onValueChange={(v) => update({ origem: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo da próxima ação</Label>
                <Input
                  id="prazo"
                  type="datetime-local"
                  value={form.prazo}
                  onChange={(e) => update({ prazo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo_desejado">Prazo desejado (cliente)</Label>
                <Input
                  id="prazo_desejado"
                  type="datetime-local"
                  value={form.prazo_desejado}
                  onChange={(e) => update({ prazo_desejado: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.criar_orcamento}
                onChange={(e) => update({ criar_orcamento: e.target.checked })}
              />
              Abrir novo orçamento após registrar (deep-link canônico)
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Registrar atendimento'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/vendas">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
