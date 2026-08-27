'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  somenteLeitura?: boolean;
}

export function MatrizPermissoesPerfil({
  modulos,
  decisoes,
  onChange,
  somenteLeitura = false,
}: MatrizPermissoesPerfilProps) {
  const [busca, setBusca] = useState('');
  const [recolhidos, setRecolhidos] = useState<Record<string, boolean>>({});
  const [pendenteCritica, setPendenteCritica] = useState<PermissaoCatalogoUi | null>(
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

  const aplicar = (permissao: PermissaoCatalogoUi, estado: Decisao) => {
    if (somenteLeitura) return;
    if (estado === 'CONCEDIDA' && permissao.risco === 'CRITICO') {
      setPendenteCritica(permissao);
      return;
    }
    onChange(permissao.chave, estado);
  };

  return (
    <div className="space-y-4">
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar permissão ou módulo"
        aria-label="Buscar permissões"
      />
      {filtrados.map((modulo) => (
        <section
          key={modulo.chave}
          className="space-y-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {modulo.nome}
            </h3>
            {modulo.statusEnforcement !== 'ENFORCED' && (
              <Badge variant="secondary">
                Enforcement {modulo.statusEnforcement.toLowerCase()}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() =>
                setRecolhidos((prev) => ({
                  ...prev,
                  [modulo.chave]: !prev[modulo.chave],
                }))
              }
            >
              {recolhidos[modulo.chave] ? 'Expandir' : 'Recolher'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
          {!recolhidos[modulo.chave] && (
            <ul className="space-y-2">
              {modulo.permissoes.map((permissao) => {
                const estado = decisoes[permissao.chave] ?? permissao.estado;
                return (
                  <li
                    key={permissao.chave}
                    className="flex flex-col gap-2 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{permissao.nome}</p>
                      <p className="text-xs text-muted-foreground">{permissao.chave}</p>
                      {estado === 'NAO_REVISADA' && (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Não revisada — acesso negado até decisão.
                        </p>
                      )}
                      {(permissao.risco === 'ALTO' || permissao.risco === 'CRITICO') && (
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
      ))}
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
    </div>
  );
}
