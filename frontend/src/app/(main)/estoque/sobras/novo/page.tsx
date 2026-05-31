'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Package, Search, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { estoqueApi, orcamentosApi } from '@/lib/api-client';

interface OrcamentoResumo {
  id: string;
  numero: string;
  titulo: string;
  cliente_nome: string;
  status: string;
}

interface CandidatoSobra {
  item_insumo_id: string;
  insumo_id: string;
  insumo_nome: string;
  produto_nome: string;
  sobra_estimada_m2: number | null;
  permite_registrar_sobra: boolean;
  sugestao: {
    descricao: string;
    dimensoes: string | null;
    area: number | null;
    quantidade: number;
    unidade_medida: string;
    material: string;
    orcamento_origem: string;
    orcamento_numero: string;
  };
}

type EstadoCandidato = 'pendente' | 'ignorado' | 'registrado';

export default function NovaSobraPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [orcamentos, setOrcamentos] = useState<OrcamentoResumo[]>([]);
  const [orcamentoSelecionado, setOrcamentoSelecionado] =
    useState<OrcamentoResumo | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoSobra[]>([]);
  const [estados, setEstados] = useState<Record<string, EstadoCandidato>>({});
  const [formularios, setFormularios] = useState<
    Record<string, CandidatoSobra['sugestao'] & { observacao?: string }>
  >({});
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const buscarOrcamentos = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setBuscando(true);
    try {
      const lista = (await orcamentosApi.buscarOrigemSobra(
        busca,
        token,
      )) as OrcamentoResumo[];
      setOrcamentos(lista);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar orçamentos');
    } finally {
      setBuscando(false);
    }
  }, [busca]);

  const selecionarOrcamento = async (orcamento: OrcamentoResumo) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setOrcamentoSelecionado(orcamento);
    setCarregandoCandidatos(true);
    try {
      const res = (await orcamentosApi.getCandidatosSobra(
        orcamento.id,
        token,
      )) as { candidatos: CandidatoSobra[] };

      const lista = res.candidatos ?? [];
      setCandidatos(lista);
      const novoEstado: Record<string, EstadoCandidato> = {};
      const novosForms: Record<string, CandidatoSobra['sugestao']> = {};
      for (const c of lista) {
        novoEstado[c.item_insumo_id] = 'pendente';
        novosForms[c.item_insumo_id] = { ...c.sugestao };
      }
      setEstados(novoEstado);
      setFormularios(novosForms);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar materiais do orçamento');
      setOrcamentoSelecionado(null);
    } finally {
      setCarregandoCandidatos(false);
    }
  };

  const atualizarForm = (
    itemId: string,
    campo: string,
    valor: string | number,
  ) => {
    setFormularios((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [campo]: valor },
    }));
  };

  const ignorar = (itemId: string) => {
    setEstados((prev) => ({ ...prev, [itemId]: 'ignorado' }));
  };

  const registrar = async (candidato: CandidatoSobra) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const form = formularios[candidato.item_insumo_id];
    if (!form?.descricao?.trim()) {
      toast.error('Informe a descrição do retalho');
      return;
    }

    setSalvandoId(candidato.item_insumo_id);
    try {
      await estoqueApi.createSobra(
        {
          insumoId: candidato.insumo_id,
          descricao: form.descricao,
          dimensoes: form.dimensoes,
          area: form.area,
          quantidade: form.quantidade,
          unidadeMedida: form.unidade_medida,
          material: form.material,
          orcamentoOrigem: form.orcamento_origem,
          origem: 'ORCAMENTO',
          observacao: form.observacao,
        },
        token,
      );
      setEstados((prev) => ({
        ...prev,
        [candidato.item_insumo_id]: 'registrado',
      }));
      toast.success(`Retalho registrado: ${candidato.insumo_nome}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao registrar sobra',
      );
    } finally {
      setSalvandoId(null);
    }
  };

  const pendentes = candidatos.filter(
    (c) => estados[c.item_insumo_id] === 'pendente',
  ).length;
  const registrados = candidatos.filter(
    (c) => estados[c.item_insumo_id] === 'registrado',
  ).length;

  return (
    <div className="container mx-auto max-w-5xl pb-10">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/estoque/sobras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova sobra / retalho</h1>
          <p className="text-sm text-muted-foreground">
            Comece pelo orçamento de origem — os dados do material são
            preenchidos automaticamente.
          </p>
        </div>
      </div>

      {!orcamentoSelecionado ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Orçamento de origem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Número, cliente ou descrição do orçamento"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void buscarOrcamentos()}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={buscando}
                onClick={() => void buscarOrcamentos()}
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            {orcamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Busque um orçamento para listar os materiais usados.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {orcamentos.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
                      onClick={() => void selecionarOrcamento(o)}
                    >
                      <div>
                        <p className="font-medium">
                          {o.numero} — {o.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {o.cliente_nome}
                        </p>
                      </div>
                      <Badge variant="outline">{o.status}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento</p>
                <p className="font-semibold">
                  {orcamentoSelecionado.numero} — {orcamentoSelecionado.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {orcamentoSelecionado.cliente_nome}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">{registrados} registrados</Badge>
                <Badge variant="outline">{pendentes} pendentes</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrcamentoSelecionado(null);
                  setCandidatos([]);
                }}
              >
                Trocar orçamento
              </Button>
            </CardContent>
          </Card>

          {carregandoCandidatos ? (
            <p className="text-sm text-muted-foreground">Carregando materiais…</p>
          ) : candidatos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Este orçamento não tem materiais cadastrados.
              </CardContent>
            </Card>
          ) : (
            candidatos.map((c) => {
              const estado = estados[c.item_insumo_id];
              const form = formularios[c.item_insumo_id];

              if (estado === 'ignorado') {
                return (
                  <Card key={c.item_insumo_id} className="opacity-50">
                    <CardContent className="flex items-center justify-between py-4">
                      <span className="text-sm line-through">
                        {c.insumo_nome} — {c.produto_nome}
                      </span>
                      <Badge variant="outline">Ignorado</Badge>
                    </CardContent>
                  </Card>
                );
              }

              if (estado === 'registrado') {
                return (
                  <Card
                    key={c.item_insumo_id}
                    className="border-emerald-200 bg-emerald-50/40"
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <span className="text-sm font-medium">
                        {c.insumo_nome} — registrado no estoque
                      </span>
                      <Badge className="bg-emerald-600">Registrado</Badge>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={c.item_insumo_id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Package className="h-4 w-4" />
                          {c.insumo_nome}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Produto: {c.produto_nome}
                          {c.sobra_estimada_m2 != null && (
                            <> · Sobra estimada: {c.sobra_estimada_m2.toFixed(2)} m²</>
                          )}
                        </p>
                      </div>
                      {!c.permite_registrar_sobra && (
                        <Badge variant="outline" className="text-amber-700">
                          Insumo sem flag de retalho
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={form?.descricao ?? ''}
                        onChange={(e) =>
                          atualizarForm(
                            c.item_insumo_id,
                            'descricao',
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label>Dimensões</Label>
                        <Input
                          value={form?.dimensoes ?? ''}
                          onChange={(e) =>
                            atualizarForm(
                              c.item_insumo_id,
                              'dimensoes',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Área (m²)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form?.area ?? ''}
                          onChange={(e) =>
                            atualizarForm(
                              c.item_insumo_id,
                              'area',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form?.quantidade ?? ''}
                          onChange={(e) =>
                            atualizarForm(
                              c.item_insumo_id,
                              'quantidade',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={salvandoId === c.item_insumo_id}
                        onClick={() => void registrar(c)}
                      >
                        Registrar retalho
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => ignorar(c.item_insumo_id)}
                      >
                        <SkipForward className="mr-2 h-4 w-4" />
                        Ignorar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {registrados > 0 && pendentes === 0 && (
            <div className="flex justify-end">
              <Button onClick={() => router.push('/estoque/sobras')}>
                Concluir e ver sobras
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
