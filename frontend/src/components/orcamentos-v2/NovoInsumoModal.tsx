'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { UnitSelect } from '@/components/ui/unit-select';
import { UNIDADES_COMPRA } from '@/lib/unidades-compra';
// Fase 11 — Opção B: unidade de uso tem lista própria (inclui M²_LATERAL para caixa aberta 3D).
import { UNIDADES_USO } from '@/lib/unidades-uso';
import {
  categoriasApi,
  fornecedoresApi,
  insumosApi,
} from '@/lib/api-client';

/**
 * Modal compacto de cadastro de insumo, usado em dois lugares:
 *  1. `DxfRevisaoCard` (Sub-fase 7.B++): cadastro a partir de camada do DXF.
 *  2. Dropdown "Material" do `MaterialSection`: opção "Cadastrar novo insumo"
 *     no rodapé do dropdown (decisão de UX: evita trocar de tela durante o
 *     preenchimento do produto).
 *
 * Mostra **apenas os 8 campos obrigatórios** do `CreateInsumoDto` + a
 * lógica de consumo (default `area`). Demais campos do cadastro completo
 * (estoque mínimo, dimensões, parametros_consumo, etc.) ficam para a tela
 * `/insumos/novo`, acessível via link no rodapé.
 *
 * Política de produto:
 *  - Categoria e Fornecedor agora usam `Combobox` com `onCreate`: o operador
 *    pode CADASTRAR categoria/fornecedor novo no próprio dropdown, sem
 *    fechar o modal nem trocar de tela. Mesmo padrão da tela `/insumos/novo`.
 *  - Unidades de compra/uso são selecionadas pela lista estruturada
 *    `UNIDADES_COMPRA` (sem digitação livre, evita erro de preenchimento).
 *  - Após criação bem-sucedida, o `onCriado` é chamado com o insumo já
 *    persistido (id real); o caller fica responsável por atrelar ao produto
 *    e/ou atualizar a lista global de insumos via `onInsumoCriado`.
 */
export interface NovoInsumoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Nome inicial sugerido. Quando vem do DXF, é o nome da camada já limpo;
   * quando vem do dropdown de Material, é string vazia.
   */
  nomeInicial: string;
  /**
   * Disparado após o insumo ser persistido com sucesso. Recebe o id real
   * do insumo criado (vindo da API) + nome final escolhido. Caller usa
   * esse callback para atrelar o insumo ao produto / linha de material.
   */
  onCriado: (insumoCriado: {
    id: string;
    nome: string;
    unidade_uso?: string;
    logica_consumo?: string;
    custo_unitario?: number;
    fator_conversao?: number;
  }) => void;
  /**
   * Disparado após criação bem-sucedida para que o caller atualize sua
   * lista global de insumos (ex.: `fetchInsumos` do `useOrcamentoData`).
   * Quando omitido, a lista global não é recarregada — mas o `onCriado`
   * continua sendo disparado normalmente. Útil em cenários onde o caller
   * gerencia o estado por outra via.
   */
  onInsumoCriado?: () => void | Promise<void>;
}

interface CategoriaApi {
  id: string;
  nome: string;
}
interface FornecedorApi {
  id: string;
  nome: string;
}

interface InsumoCriadoApi {
  id: string;
  nome: string;
}

const LOGICAS_CONSUMO: Array<{ value: string; label: string }> = [
  { value: 'area', label: 'Por área (m²) — chapas e similares' },
  { value: 'perimetro', label: 'Por perímetro (m) — fitas, bordas' },
  { value: 'quantidade_fixa', label: 'Quantidade fixa por peça' },
  { value: 'custom', label: 'Personalizada (configurar depois)' },
];

function obterToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

function parseDecimalInput(value: string): number {
  if (!value) return 0;
  // Suporta valores vindos do CustomCurrencyInput ("12.34")
  // e entradas manuais no formato brasileiro ("12,34" / "R$ 12,34").
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=.*\.)/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function NovoInsumoModal({
  open,
  onOpenChange,
  nomeInicial,
  onCriado,
  onInsumoCriado,
}: NovoInsumoModalProps) {
  // Form state
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [unidadeCompra, setUnidadeCompra] = useState('M2');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [quantidadeCompra, setQuantidadeCompra] = useState('1');
  const [unidadeUso, setUnidadeUso] = useState('M2');
  const [fatorConversao, setFatorConversao] = useState('1');
  const [logicaConsumo, setLogicaConsumo] = useState('area');

  const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorApi[]>([]);
  const [carregandoListas, setCarregandoListas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroListas, setErroListas] = useState<string | null>(null);

  // Reset / carga ao abrir o modal.
  useEffect(() => {
    if (!open) return;
    setNome(nomeInicial || '');
    setCategoriaId('');
    setFornecedorId('');
    setUnidadeCompra('M2');
    setCustoUnitario('');
    setQuantidadeCompra('1');
    setUnidadeUso('M2');
    setFatorConversao('1');
    setLogicaConsumo('area');
    setErroListas(null);

    const carregar = async () => {
      setCarregandoListas(true);
      try {
        const token = obterToken();
        const [cats, forns] = await Promise.all([
          categoriasApi.getAll(token) as Promise<CategoriaApi[]>,
          fornecedoresApi.getAll(token) as Promise<FornecedorApi[]>,
        ]);
        setCategorias(Array.isArray(cats) ? cats : []);
        setFornecedores(Array.isArray(forns) ? forns : []);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Falha ao carregar listas de categoria/fornecedor';
        setErroListas(msg);
      } finally {
        setCarregandoListas(false);
      }
    };
    void carregar();
  }, [open, nomeInicial]);

  /**
   * Cadastro inline de categoria a partir do `Combobox`. Reaproveita o
   * padrão da tela `/insumos/novo` (insumo-form.tsx).
   */
  const handleCreateCategoria = async (nomeNovo: string) => {
    if (!nomeNovo || nomeNovo.trim().length === 0) return;
    try {
      const token = obterToken();
      const criado = (await categoriasApi.create(
        { nome: nomeNovo.trim() },
        token,
      )) as CategoriaApi;
      setCategorias((prev) => [...prev, criado]);
      setCategoriaId(criado.id);
      toast.success(`Categoria "${criado.nome}" criada.`);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Falha ao criar categoria';
      toast.error(msg);
    }
  };

  const handleCreateFornecedor = async (nomeNovo: string) => {
    if (!nomeNovo || nomeNovo.trim().length === 0) return;
    try {
      const token = obterToken();
      const criado = (await fornecedoresApi.create(
        { nome: nomeNovo.trim() },
        token,
      )) as FornecedorApi;
      setFornecedores((prev) => [...prev, criado]);
      setFornecedorId(criado.id);
      toast.success(`Fornecedor "${criado.nome}" criado.`);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Falha ao criar fornecedor';
      toast.error(msg);
    }
  };

  const podeSalvar =
    nome.trim().length > 0 &&
    !!categoriaId &&
    !!fornecedorId &&
    unidadeCompra.trim().length > 0 &&
    unidadeUso.trim().length > 0 &&
    parseDecimalInput(custoUnitario) > 0 &&
    Number(quantidadeCompra.replace(',', '.')) > 0 &&
    Number(fatorConversao.replace(',', '.')) > 0 &&
    !salvando;

  const handleSalvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      const token = obterToken();
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        categoriaId,
        fornecedorId,
        unidade_compra: unidadeCompra.trim(),
        custo_unitario: parseDecimalInput(custoUnitario),
        quantidade_compra: Number(quantidadeCompra.replace(',', '.')),
        unidade_uso: unidadeUso.trim(),
        fator_conversao: Number(fatorConversao.replace(',', '.')),
        logica_consumo: logicaConsumo,
      };
      const criado = (await insumosApi.create(payload, token)) as InsumoCriadoApi;
      toast.success(`Insumo "${criado.nome}" cadastrado.`);
      // Atualiza a lista global de insumos do parent (re-fetch) ANTES de
      // disparar onCriado para que a UI já encontre o insumo pelo id quando
      // for atrelar.
      if (onInsumoCriado) {
        try {
          await onInsumoCriado();
        } catch {
          // Falha de re-fetch não bloqueia o fluxo — o id real já foi
          // retornado e o caller pode atrelar mesmo sem a lista atualizada.
        }
      }
      onCriado({
        id: criado.id,
        nome: criado.nome,
        unidade_uso: unidadeUso.trim(),
        logica_consumo: logicaConsumo,
        custo_unitario: parseDecimalInput(custoUnitario),
        fator_conversao: Number(fatorConversao.replace(',', '.')),
      });
      onOpenChange(false);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Falha ao cadastrar insumo';
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Cadastrar novo insumo</DialogTitle>
          <DialogDescription>
            Preencha os campos essenciais. Para configurar dimensões,
            estoque mínimo e parâmetros avançados, use o{' '}
            <a
              href="/insumos/novo"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              cadastro completo
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        {erroListas ? (
          <div className="rounded bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive">
            {erroListas}
          </div>
        ) : null}

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="ni-nome">Nome do insumo</Label>
            <Input
              id="ni-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Chapa ACM 3mm Branco"
              disabled={salvando}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Categoria</Label>
              <Combobox
                options={categorias.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
                value={categoriaId}
                onChange={setCategoriaId}
                onCreate={(nomeNovo) => void handleCreateCategoria(nomeNovo)}
                placeholder={
                  carregandoListas ? 'Carregando...' : 'Selecione ou crie'
                }
                createPlaceholder="Criar categoria"
                disabled={salvando || carregandoListas}
              />
            </div>

            <div className="grid gap-1">
              <Label>Fornecedor</Label>
              <Combobox
                options={fornecedores.map((f) => ({
                  value: f.id,
                  label: f.nome,
                }))}
                value={fornecedorId}
                onChange={setFornecedorId}
                onCreate={(nomeNovo) => void handleCreateFornecedor(nomeNovo)}
                placeholder={
                  carregandoListas ? 'Carregando...' : 'Selecione ou crie'
                }
                createPlaceholder="Criar fornecedor"
                disabled={salvando || carregandoListas}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Custo unitário (R$)</Label>
              <CustomCurrencyInput
                value={custoUnitario}
                onValueChange={setCustoUnitario}
                placeholder="0,00"
                disabled={salvando}
              />
            </div>
            <div className="grid gap-1">
              <Label>Qtd. de compra</Label>
              <Input
                value={quantidadeCompra}
                onChange={(e) =>
                  setQuantidadeCompra(
                    e.target.value.replace(/[^0-9,.]/g, ''),
                  )
                }
                placeholder="1"
                disabled={salvando}
              />
            </div>
            <div className="grid gap-1">
              <Label>Fator de conversão</Label>
              <Input
                value={fatorConversao}
                onChange={(e) =>
                  setFatorConversao(
                    e.target.value.replace(/[^0-9,.]/g, ''),
                  )
                }
                placeholder="1"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Unidade de compra</Label>
              <UnitSelect
                value={unidadeCompra}
                onValueChange={setUnidadeCompra}
                placeholder="Selecione"
                units={UNIDADES_COMPRA}
              />
            </div>
            <div className="grid gap-1">
              <Label>Unidade de uso</Label>
              <UnitSelect
                value={unidadeUso}
                onValueChange={setUnidadeUso}
                placeholder="Selecione"
                units={UNIDADES_USO}
              />
            </div>
            <div className="grid gap-1">
              <Label>Lógica de consumo</Label>
              <Select
                value={logicaConsumo}
                onValueChange={setLogicaConsumo}
                disabled={salvando}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGICAS_CONSUMO.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSalvar}
            disabled={!podeSalvar}
            className="gap-2"
          >
            {salvando ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Cadastrar e atrelar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
