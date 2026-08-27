'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/api';
import { extrairListaPaginada } from '@/lib/lista-paginada';

export const FUNCOES_OPERACIONAIS = [
  'VENDAS',
  'FINANCEIRO',
  'PRODUCAO',
  'ESTOQUE',
] as const;

export const ROTULOS_FUNCAO: Record<string, string> = {
  VENDAS: 'Vendas',
  FINANCEIRO: 'Financeiro',
  PRODUCAO: 'Produção',
  ESTOQUE: 'Estoque',
  ADMINISTRADOR: 'Administrador',
};

type PerfilOpcao = {
  id: string;
  nome: string;
  sistema?: boolean;
  ativo?: boolean;
};

type UsuarioCamposAcessoProps = {
  funcao: string;
  onFuncaoChange: (funcao: string) => void;
  perfilIds: string[];
  onPerfilIdsChange: (ids: string[]) => void;
  podeConcederAdmin: boolean;
  disabled?: boolean;
};

export function UsuarioCamposAcesso({
  funcao,
  onFuncaoChange,
  perfilIds,
  onPerfilIdsChange,
  podeConcederAdmin,
  disabled = false,
}: UsuarioCamposAcessoProps) {
  const [perfis, setPerfis] = useState<PerfilOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfis = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await apiRequest('/usuarios/perfis?limit=100');
      if (!res.ok) {
        throw new Error('Não foi possível carregar os perfis desta loja.');
      }
      const lista = extrairListaPaginada<PerfilOpcao>(await res.json());
      setPerfis(lista.items);
    } catch (e: unknown) {
      setPerfis([]);
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os perfis desta loja.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarPerfis();
  }, [carregarPerfis]);

  const perfisVisiveis = useMemo(
    () =>
      perfis.filter(
        (perfil) => perfil.ativo !== false || perfilIds.includes(perfil.id),
      ),
    [perfis, perfilIds],
  );

  const alternarPerfil = (perfilId: string, marcado: boolean) => {
    if (marcado) {
      if (perfilIds.includes(perfilId)) return;
      onPerfilIdsChange([...perfilIds, perfilId]);
      return;
    }
    onPerfilIdsChange(perfilIds.filter((id) => id !== perfilId));
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="usuario-funcao">Função</Label>
        <Select
          value={funcao}
          onValueChange={onFuncaoChange}
          disabled={disabled}
        >
          <SelectTrigger id="usuario-funcao">
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            {FUNCOES_OPERACIONAIS.map((valor) => (
              <SelectItem key={valor} value={valor}>
                {ROTULOS_FUNCAO[valor]}
              </SelectItem>
            ))}
            {podeConcederAdmin ? (
              <SelectItem value="ADMINISTRADOR">
                {ROTULOS_FUNCAO.ADMINISTRADOR}
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          A função é o piso legado de acesso. As permissões que você configurou
          ficam nos perfis abaixo. Somente um administrador da loja pode
          conceder a função Administrador.
        </p>
        {funcao === 'ADMINISTRADOR' ? (
          <Alert>
            <AlertDescription>
              Administrador ignora as restrições dos perfis. Para aplicar só o
              perfil que você criou, escolha outra função (por exemplo Vendas)
              e marque o perfil na lista.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <fieldset className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Perfis de acesso
        </legend>
        <p className="text-xs text-muted-foreground">
          Marque o perfil configurado na Gestão de perfis. Um usuário pode ter
          mais de um.
        </p>
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando perfis…</p>
        ) : erro ? (
          <div className="grid gap-2">
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void carregarPerfis()}
              disabled={disabled}
            >
              Tentar de novo
            </Button>
          </div>
        ) : perfisVisiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum perfil ativo nesta loja.{' '}
            <Link href="/usuarios/perfis/novo" className="underline">
              Criar perfil
            </Link>
          </p>
        ) : (
          <div className="grid gap-2">
            {perfisVisiveis.map((perfil) => {
              const idCampo = `usuario-perfil-${perfil.id}`;
              return (
                <div key={perfil.id} className="flex items-start gap-2">
                  <Checkbox
                    id={idCampo}
                    checked={perfilIds.includes(perfil.id)}
                    disabled={disabled || perfil.ativo === false}
                    onCheckedChange={(estado) =>
                      alternarPerfil(perfil.id, estado === true)
                    }
                  />
                  <Label htmlFor={idCampo} className="font-normal">
                    {perfil.nome}
                    {perfil.sistema ? (
                      <span className="text-muted-foreground"> (sistema)</span>
                    ) : null}
                    {perfil.ativo === false ? (
                      <span className="text-muted-foreground"> (inativo)</span>
                    ) : null}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </fieldset>
    </div>
  );
}
