'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserPlus } from 'lucide-react';
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

type FormState = {
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

  const update = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!form.nome.trim() || !form.necessidade.trim() || !form.prazo) {
      toast.error('Preencha nome, necessidade e prazo.');
      return;
    }

    setLoading(true);
    try {
      const token = getClientSessionToken();
      if (!token) {
        toast.error('Sessão inválida.');
        return;
      }

      const body = {
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

  if (
    !acesso.pode_acessar_modulo ||
    !acesso.permissoes.atividade_gerenciar ||
    !acesso.permissoes.cliente_criar
  ) {
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
        subtitle="Registre demanda com próxima ação e, se quiser, abra o orçamento canônico."
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do cliente</Label>
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
                onChange={(e) =>
                  update({ criar_orcamento: e.target.checked })
                }
              />
              Abrir orçamento no fluxo canônico após salvar
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
