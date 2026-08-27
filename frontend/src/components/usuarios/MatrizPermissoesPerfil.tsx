'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export type PermissaoCatalogoUi = {
  chave: string;
  nome: string;
  descricao: string;
  grupo: string;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  estado: 'CONCEDIDA' | 'NEGADA' | 'NAO_REVISADA';
};

export type ModuloCatalogoUi = {
  chave: string;
  nome: string;
  descricao: string;
  statusEnforcement: 'ENFORCED' | 'PARCIAL' | 'PENDENTE';
  permissaoAcesso: string;
  permissoes: PermissaoCatalogoUi[];
};

type Decisao = 'CONCEDIDA' | 'NEGADA' | 'NAO_REVISADA';

interface MatrizPermissoesPerfilProps {
  modulos: ModuloCatalogoUi[];
  decisoes: Record<string, Decisao>;
  onChange: (chave: string, estado: Decisao) => void;
  onChangeVarias?: (alteracoes: Record<string, Decisao>) => void;
  somenteLeitura?: boolean;
}

function estadoAtual(
  permissao: PermissaoCatalogoUi,
  decisoes: Record<string, Decisao>,
): Decisao {
  return decisoes[permissao.chave] ?? permissao.estado;
}

function resumoDoModulo(
  modulo: ModuloCatalogoUi,
  decisoes: Record<string, Decisao>,
) {
  const total = modulo.permissoes.length;
  const concedidas = modulo.permissoes.filter(
    (p) => estadoAtual(p, decisoes) === 'CONCEDIDA',
  ).length;
  const negadas = modulo.permissoes.filter(
    (p) => estadoAtual(p, decisoes) === 'NEGADA',
  ).length;
  const criticas = modulo.permissoes.filter((p) => p.risco === 'CRITICO');
  return {
    total,
    concedidas,
    negadas,
    todasConcedidas: total > 0 && concedidas === total,
    todasNegadas: total > 0 && negadas === total,
    misto: concedidas > 0 && concedidas < total,
    criticas,
  };
}

export function MatrizPermissoesPerfil({
  modulos,
  decisoes,
  onChange,
  onChangeVarias,
  somenteLeitura = false,
}: MatrizPermissoesPerfilProps) {
  const [busca, setBusca] = useState('');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [pendenteCritica, setPendenteCritica] = useState<PermissaoCatalogoUi | null>(
    null,
  );
  const [pendenteModulo, setPendenteModulo] = useState<ModuloCatalogoUi | null>(
    null,
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return modulos;
    return modulos
      .map((modulo) => ({
        ...modulo,
        permissoes: modulo.permissoes.filter(
          (p) =>
            p.nome.toLowerCase().includes(termo) ||
            p.chave.toLowerCase().includes(termo) ||
            modulo.nome.toLowerCase().includes(termo),
        ),
      }))
      .filter(
        (modulo) =>
          modulo.permissoes.length > 0 ||
          modulo.nome.toLowerCase().includes(termo),
      );
  }, [modulos, busca]);

  const aplicarVarias = (alteracoes: Record<string, Decisao>) => {
    if (onChangeVarias) {
      onChangeVarias(alteracoes);
      return;
    }
    for (const [chave, estado] of Object.entries(alteracoes)) {
      onChange(chave, estado);
    }
  };

  const aplicar = (permissao: PermissaoCatalogoUi, estado: Decisao) => {
    if (somenteLeitura) return;
    if (estado === 'CONCEDIDA' && permissao.risco === 'CRITICO') {
      setPendenteCritica(permissao);
      return;
    }
    onChange(permissao.chave, estado);
  };

  const concederModulo = (modulo: ModuloCatalogoUi) => {
    const alteracoes: Record<string, Decisao> = {};
    for (const permissao of modulo.permissoes) {
      alteracoes[permissao.chave] = 'CONCEDIDA';
    }
    aplicarVarias(alteracoes);
  };

  const negarModulo = (modulo: ModuloCatalogoUi) => {
    const alteracoes: Record<string, Decisao> = {};
    for (const permissao of modulo.permissoes) {
      alteracoes[permissao.chave] = 'NEGADA';
    }
    aplicarVarias(alteracoes);
  };

  const alternarModulo = (modulo: ModuloCatalogoUi, ligado: boolean) => {
    if (somenteLeitura) return;
    if (!ligado) {
      negarModulo(modulo);
      return;
    }
    const criticas = modulo.permissoes.filter((p) => p.risco === 'CRITICO');
    if (criticas.length > 0) {
      setPendenteModulo(modulo);
      return;
    }
    concederModulo(modulo);
  };

  const buscando = busca.trim().length > 0;
  const criticasDoModulo = pendenteModulo
    ? pendenteModulo.permissoes.filter((p) => p.risco === 'CRITICO')
    : [];

  return (
    <div className="space-y-4">
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar permissão ou módulo"
        aria-label="Buscar permissões"
      />
      {filtrados.map((modulo) => {
        const resumo = resumoDoModulo(modulo, decisoes);
        const expandido = buscando || Boolean(expandidos[modulo.chave]);
        const rotuloEstado = resumo.todasConcedidas
          ? 'Módulo concedido'
          : resumo.todasNegadas
            ? 'Módulo negado'
            : resumo.misto
              ? `Parcial · ${resumo.concedidas} de ${resumo.total}`
              : 'Sem decisão de lote';

        return (
          <section
            key={modulo.chave}
            className="space-y-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Switch
                id={`modulo-toggle-${modulo.chave}`}
                checked={resumo.todasConcedidas}
                disabled={somenteLeitura || modulo.permissoes.length === 0}
                onCheckedChange={(ligado) => alternarModulo(modulo, ligado)}
                aria-label={`Conceder ou negar todas as permissões de ${modulo.nome}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Label
                    htmlFor={`modulo-toggle-${modulo.chave}`}
                    className="cursor-pointer text-base font-semibold text-foreground"
                  >
                    {modulo.nome}
                  </Label>
                  {modulo.statusEnforcement !== 'ENFORCED' && (
                    <Badge variant="secondary">
                      Enforcement {modulo.statusEnforcement.toLowerCase()}
                    </Badge>
                  )}
                  {resumo.criticas.length > 0 && (
                    <Badge variant="destructive">
                      {resumo.criticas.length === 1
                        ? '1 alçada crítica'
                        : `${resumo.criticas.length} alçadas críticas`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{rotuloEstado}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={expandido}
                onClick={() =>
                  setExpandidos((prev) => ({
                    ...prev,
                    [modulo.chave]: !prev[modulo.chave],
                  }))
                }
              >
                {expandido ? (
                  <ChevronDown className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-1 h-4 w-4" />
                )}
                {expandido ? 'Recolher' : 'Detalhar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
            {expandido && (
              <ul className="space-y-2">
                {modulo.permissoes.map((permissao) => {
                  const estado = estadoAtual(permissao, decisoes);
                  return (
                    <li
                      key={permissao.chave}
                      className="flex flex-col gap-2 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {permissao.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {permissao.chave}
                        </p>
                        {estado === 'NAO_REVISADA' && (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Não revisada — acesso negado até decisão.
                          </p>
                        )}
                        {(permissao.risco === 'ALTO' ||
                          permissao.risco === 'CRITICO') && (
                          <Badge variant="destructive" className="mt-1">
                            Risco {permissao.risco.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-sm ${
                            estado === 'CONCEDIDA'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground'
                          }`}
                          disabled={somenteLeitura}
                          onClick={() => aplicar(permissao, 'CONCEDIDA')}
                        >
                          Conceder
                        </button>
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-sm ${
                            estado === 'NEGADA'
                              ? 'border-destructive bg-destructive text-destructive-foreground'
                              : 'border-border bg-background text-foreground'
                          }`}
                          disabled={somenteLeitura}
                          onClick={() => aplicar(permissao, 'NEGADA')}
                        >
                          Negar
                        </button>
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-sm ${
                            estado === 'NAO_REVISADA'
                              ? 'border-border bg-muted text-foreground'
                              : 'border-border bg-background text-foreground'
                          }`}
                          disabled={somenteLeitura}
                          onClick={() => aplicar(permissao, 'NAO_REVISADA')}
                        >
                          Não revisar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
      <ConfirmDialog
        open={!!pendenteCritica}
        title="Conceder permissão crítica"
        description={
          pendenteCritica
            ? `A permissão ${pendenteCritica.nome} é crítica. Confirme que deseja concedê-la.`
            : ''
        }
        confirmText="Conceder"
        cancelText="Cancelar"
        onCancel={() => setPendenteCritica(null)}
        onConfirm={() => {
          if (pendenteCritica) {
            onChange(pendenteCritica.chave, 'CONCEDIDA');
          }
          setPendenteCritica(null);
        }}
      />
      <ConfirmDialog
        open={!!pendenteModulo}
        title={
          pendenteModulo
            ? `Conceder o módulo ${pendenteModulo.nome} por completo`
            : 'Conceder módulo por completo'
        }
        description={
          pendenteModulo
            ? `O módulo ${pendenteModulo.nome} inclui alçadas críticas: ${criticasDoModulo
                .map((p) => p.nome)
                .join(', ')}. Confirmar concede todas as permissões deste módulo a este perfil, inclusive as críticas. Quem receber o perfil poderá executar essas ações na loja. Se a intenção for um acesso mais restrito, cancele e ajuste item a item.`
            : ''
        }
        confirmText="Conceder módulo inteiro"
        cancelText="Cancelar"
        onCancel={() => setPendenteModulo(null)}
        onConfirm={() => {
          if (pendenteModulo) {
            concederModulo(pendenteModulo);
          }
          setPendenteModulo(null);
        }}
      />
    </div>
  );
}
