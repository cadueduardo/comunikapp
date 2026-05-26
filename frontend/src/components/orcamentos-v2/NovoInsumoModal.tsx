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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  categoriasApi,
  fornecedoresApi,
  insumosApi,
} from '@/lib/api-client';

/**
 * Modal compacto de cadastro de insumo, acionado a partir do
 * `DxfRevisaoCard` (Sub-fase 7.B++) quando o operador clica em "Cadastrar
 * novo" para uma camada que não tem sugestão no catálogo.
 *
 * Mostra **apenas os 8 campos obrigatórios** do `CreateInsumoDto` + a
 * lógica de consumo (default `area`). Demais campos do cadastro completo
 * (estoque mínimo, dimensões, parametros_consumo, etc.) ficam para a tela
 * `/insumos/novo`, acessível via link no rodapé.
 *
 * Política de produto:
 *  - Nunca tenta inferir categoria/fornecedor: o operador é obrigado a
 *    escolher dos cadastros existentes da loja. Se a loja não tiver pelo
 *    menos uma categoria E um fornecedor, o modal mostra aviso e o botão
 *    de cadastrar fica desabilitado.
 *  - Após criação bem-sucedida, o `onCriado` é chamado com o insumo já
 *    persistido (id real); o caller fica responsável por atrelar ao produto
 *    e/ou atualizar a lista de sugestões.
 */
export interface NovoInsumoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Nome inicial sugerido (vem do nome da camada do DXF, já limpo).
   * O operador pode editar antes de salvar.
   */
  nomeInicial: string;
  /**
   * Disparado após o insumo ser persistido com sucesso. Recebe o id real
   * do insumo criado (vindo da API) + nome final escolhido.
   */
  onCriado: (insumoCriado: { id: string; nome: string }) => void;
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

export function NovoInsumoModal({
  open,
  onOpenChange,
  nomeInicial,
  onCriado,
}: NovoInsumoModalProps) {
  // Form state
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [unidadeCompra, setUnidadeCompra] = useState('m2');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [quantidadeCompra, setQuantidadeCompra] = useState('1');
  const [unidadeUso, setUnidadeUso] = useState('m2');
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
    setUnidadeCompra('m2');
    setCustoUnitario('');
    setQuantidadeCompra('1');
    setUnidadeUso('m2');
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

  const podeSalvar =
    nome.trim().length > 0 &&
    !!categoriaId &&
    !!fornecedorId &&
    unidadeCompra.trim().length > 0 &&
    unidadeUso.trim().length > 0 &&
    Number(custoUnitario.replace(',', '.')) > 0 &&
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
        custo_unitario: Number(custoUnitario.replace(',', '.')),
        quantidade_compra: Number(quantidadeCompra.replace(',', '.')),
        unidade_uso: unidadeUso.trim(),
        fator_conversao: Number(fatorConversao.replace(',', '.')),
        logica_consumo: logicaConsumo,
      };
      const criado = (await insumosApi.create(payload, token)) as InsumoCriadoApi;
      toast.success(`Insumo "${criado.nome}" cadastrado e atrelado.`);
      onCriado({ id: criado.id, nome: criado.nome });
      onOpenChange(false);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Falha ao cadastrar insumo';
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const semCadastrosBasicos =
    !carregandoListas && (categorias.length === 0 || fornecedores.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
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

        {semCadastrosBasicos && !erroListas ? (
          <div className="rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
            Para cadastrar insumos é preciso ter pelo menos{' '}
            <strong>uma categoria</strong> e <strong>um fornecedor</strong>{' '}
            já registrados na loja. Cadastre essas referências antes em
            Configurações.
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
              <Select
                value={categoriaId}
                onValueChange={setCategoriaId}
                disabled={salvando || carregandoListas || categorias.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoListas ? 'Carregando...' : 'Selecione'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Fornecedor</Label>
              <Select
                value={fornecedorId}
                onValueChange={setFornecedorId}
                disabled={
                  salvando || carregandoListas || fornecedores.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoListas ? 'Carregando...' : 'Selecione'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Custo unitário (R$)</Label>
              <Input
                value={custoUnitario}
                onChange={(e) =>
                  setCustoUnitario(
                    e.target.value.replace(/[^0-9,.]/g, ''),
                  )
                }
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
              <Input
                value={unidadeCompra}
                onChange={(e) => setUnidadeCompra(e.target.value)}
                placeholder="m2, un, kg, etc."
                disabled={salvando}
              />
            </div>
            <div className="grid gap-1">
              <Label>Unidade de uso</Label>
              <Input
                value={unidadeUso}
                onChange={(e) => setUnidadeUso(e.target.value)}
                placeholder="m2, un, kg, etc."
                disabled={salvando}
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
            disabled={!podeSalvar || semCadastrosBasicos}
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
