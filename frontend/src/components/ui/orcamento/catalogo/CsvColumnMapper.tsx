'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MAX_CSV_VDP_ROWS,
  type CampoVariavelDefOrcamento,
} from '@/lib/catalogo/personalizacao-orcamento.types';
import { parseCsvTexto } from '@/lib/catalogo/csv-sanitizer';

interface CsvColumnMapperProps {
  campos: CampoVariavelDefOrcamento[];
  quantidadeEsperada: number;
  onDadosMapeados: (linhas: Array<Record<string, string>>) => void;
  disabled?: boolean;
}

const COLUNA_NAO_MAPEAR = '__nao_mapear__';

export function CsvColumnMapper({
  campos,
  quantidadeEsperada,
  onDadosMapeados,
  disabled,
}: CsvColumnMapperProps) {
  const [cabecalho, setCabecalho] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<string[][]>([]);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  const camposOrdenados = [...campos].sort((a, b) => a.ordem - b.ordem);

  const handleArquivo = useCallback(
    async (file: File | null) => {
      if (!file) return;

      const nome = file.name.toLowerCase();
      if (!nome.endsWith('.csv') && !nome.endsWith('.txt')) {
        toast.error('Use um arquivo CSV (.csv). Para Excel, exporte como CSV.');
        return;
      }

      const texto = await file.text();
      const resultado = parseCsvTexto(texto);

      if (resultado.erros.length) {
        resultado.erros.slice(0, 5).forEach((e) => toast.warning(e));
      }

      if (!resultado.cabecalho.length) {
        toast.error('Não foi possível ler o cabeçalho do arquivo.');
        return;
      }

      if (resultado.linhas.length > MAX_CSV_VDP_ROWS) {
        toast.error(`O arquivo excede o limite de ${MAX_CSV_VDP_ROWS} linhas.`);
        return;
      }

      setCabecalho(resultado.cabecalho);
      setLinhas(resultado.linhas);
      setNomeArquivo(file.name);

      const mapaInicial: Record<string, string> = {};
      for (const campo of camposOrdenados) {
        const colunaIgual = resultado.cabecalho.find(
          (c) => c.toLowerCase() === campo.label.toLowerCase() || c.toLowerCase() === campo.chave.toLowerCase(),
        );
        mapaInicial[campo.chave] = colunaIgual ?? COLUNA_NAO_MAPEAR;
      }
      setMapeamento(mapaInicial);
    },
    [camposOrdenados],
  );

  const aplicarMapeamento = () => {
    const obrigatorios = camposOrdenados.filter((c) => c.obrigatorio);
    for (const campo of obrigatorios) {
      const col = mapeamento[campo.chave];
      if (!col || col === COLUNA_NAO_MAPEAR) {
        toast.error(`Mapeie a coluna do campo obrigatório: ${campo.label}`);
        return;
      }
    }

    const dados: Array<Record<string, string>> = linhas.map((row) => {
      const obj: Record<string, string> = {};
      for (const campo of camposOrdenados) {
        const colNome = mapeamento[campo.chave];
        if (!colNome || colNome === COLUNA_NAO_MAPEAR) {
          obj[campo.chave] = '';
          continue;
        }
        const idx = cabecalho.indexOf(colNome);
        obj[campo.chave] = idx >= 0 ? (row[idx] ?? '').trim() : '';
      }
      return obj;
    });

    if (quantidadeEsperada > 1 && dados.length !== quantidadeEsperada) {
      toast.error(
        `A planilha tem ${dados.length} linha(s), mas a quantidade do item é ${quantidadeEsperada}.`,
      );
      return;
    }

    onDadosMapeados(dados);
    toast.success(`${dados.length} unidade(s) importada(s) da planilha.`);
  };

  return (
    <div className="space-y-4 rounded-md border border-dashed p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="csv-vdp-upload" className="sr-only">
          Upload CSV
        </Label>
        <Button type="button" variant="outline" size="sm" disabled={disabled} asChild>
          <label htmlFor="csv-vdp-upload" className="cursor-pointer gap-2">
            <Upload className="h-4 w-4" />
            Selecionar CSV
          </label>
        </Button>
        <input
          id="csv-vdp-upload"
          type="file"
          accept=".csv,text/csv,.txt"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            void handleArquivo(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        {nomeArquivo ? (
          <span className="text-sm text-muted-foreground">{nomeArquivo}</span>
        ) : null}
      </div>

      {cabecalho.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Relacione cada campo do produto com uma coluna da planilha ({linhas.length}{' '}
            linha(s) de dados).
          </p>
          <div className="space-y-3">
            {camposOrdenados.map((campo) => (
              <div
                key={campo.id}
                className="grid gap-2 sm:grid-cols-2 sm:items-center"
              >
                <span className="text-sm font-medium">
                  {campo.label}
                  {campo.obrigatorio ? ' *' : ''}
                </span>
                <Select
                  disabled={disabled}
                  value={mapeamento[campo.chave] ?? COLUNA_NAO_MAPEAR}
                  onValueChange={(v) =>
                    setMapeamento((prev) => ({ ...prev, [campo.chave]: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Coluna da planilha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={COLUNA_NAO_MAPEAR}>— Não mapear —</SelectItem>
                    {cabecalho.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" disabled={disabled} onClick={aplicarMapeamento}>
            Aplicar mapeamento
          </Button>
        </>
      ) : null}
    </div>
  );
}
