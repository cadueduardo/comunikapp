'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildApiUrl } from '@/lib/config';
import { hasClientSession } from '@/lib/session-auth';

type DominioCustomSectionProps = {
  slug: string;
  initialDominio: string | null;
  initialStatus: string | null;
  initialToken: string | null;
  onChanged: () => void;
};

type Instrucoes = {
  cname_host: string;
  cname_alvo: string;
  txt_host: string;
  txt_valor: string | null;
  nota_apex: string;
  nota_trafego: string;
};

export function DominioCustomSection({
  slug,
  initialDominio,
  initialStatus,
  initialToken,
  onChanged,
}: DominioCustomSectionProps) {
  const [dominioInput, setDominioInput] = useState(initialDominio ?? '');
  const [status, setStatus] = useState(initialStatus ?? 'NONE');
  const [token, setToken] = useState(initialToken);
  const [instrucoes, setInstrucoes] = useState<Instrucoes | null>(
    initialDominio && initialToken
      ? {
          cname_host: initialDominio,
          cname_alvo: `${slug}.comunikapp.com.br`,
          txt_host: `_comunikapp-verify.${initialDominio}`,
          txt_valor: initialToken,
          nota_apex:
            'Se for o domínio raiz (apex), use ALIAS/ANAME (ou A) conforme seu DNS e mantenha o TXT de verificação.',
          nota_trafego:
            'DNS verificado habilita o vínculo no ComunikApp. Tráfego HTTPS no domínio próprio pode exigir Cloudflare for SaaS (Custom Hostnames) na operação.',
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [detalhes, setDetalhes] = useState<string[]>([]);

  useEffect(() => {
    setDominioInput(initialDominio ?? '');
    setStatus(initialStatus ?? 'NONE');
    setToken(initialToken);
  }, [initialDominio, initialStatus, initialToken]);

  async function salvar() {
    if (!hasClientSession()) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(buildApiUrl('/lojas/dominio-custom'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ dominio: dominioInput.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Não foi possível salvar o domínio.');
      }
      setStatus(data.dominio_custom_status || 'PENDENTE');
      setToken(data.instrucoes?.txt_valor ?? null);
      setInstrucoes(data.instrucoes ?? null);
      setDetalhes([]);
      toast.success('Domínio salvo. Configure o DNS e clique em Verificar.');
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar domínio.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verificar() {
    if (!hasClientSession()) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(buildApiUrl('/lojas/dominio-custom/verificar'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Falha na verificação DNS.');
      }
      setStatus(data.dominio_custom_status || 'ERRO');
      setInstrucoes(data.instrucoes ?? instrucoes);
      setDetalhes(data.verificacao?.detalhes || []);
      if (data.dominio_custom_status === 'VERIFICADO') {
        toast.success('Domínio verificado com sucesso.');
      } else {
        toast.error('Ainda não foi possível verificar o DNS.');
      }
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao verificar domínio.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remover() {
    if (!hasClientSession()) return;
    setBusy(true);
    try {
      const res = await fetch(buildApiUrl('/lojas/dominio-custom'), {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Não foi possível remover.');
      }
      setDominioInput('');
      setStatus('NONE');
      setToken(null);
      setInstrucoes(null);
      setDetalhes([]);
      toast.success('Domínio próprio removido.');
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover domínio.',
      );
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    status === 'VERIFICADO'
      ? 'Verificado'
      : status === 'PENDENTE'
        ? 'Aguardando DNS'
        : status === 'ERRO'
          ? 'DNS incompleto'
          : 'Não configurado';

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Domínio próprio
        </h3>
        <p className="text-sm text-muted-foreground">
          Use um subdomínio (ex.: sistema.minhaloja.com.br) ou o domínio raiz
          (ex.: minhaloja.com.br). Status: <strong>{statusLabel}</strong>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dominio-custom">Domínio</Label>
        <Input
          id="dominio-custom"
          value={dominioInput}
          onChange={(e) => setDominioInput(e.target.value.toLowerCase())}
          placeholder="sistema.minhaloja.com.br"
          disabled={busy}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void salvar()} disabled={busy || !dominioInput.trim()}>
          Salvar domínio
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void verificar()}
          disabled={busy || !token}
        >
          Verificar DNS
        </Button>
        {status !== 'NONE' && status ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void remover()}
            disabled={busy}
          >
            Remover
          </Button>
        ) : null}
      </div>

      {instrucoes ? (
        <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Registros DNS sugeridos</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              <span className="font-mono text-foreground">CNAME</span>{' '}
              <code className="text-foreground">{instrucoes.cname_host}</code> →{' '}
              <code className="text-foreground">{instrucoes.cname_alvo}</code>
            </li>
            <li>
              <span className="font-mono text-foreground">TXT</span>{' '}
              <code className="text-foreground">{instrucoes.txt_host}</code> ={' '}
              <code className="text-foreground break-all">
                {instrucoes.txt_valor}
              </code>
            </li>
          </ol>
          <p>{instrucoes.nota_apex}</p>
          <p>{instrucoes.nota_trafego}</p>
        </div>
      ) : null}

      {detalhes.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {detalhes.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
