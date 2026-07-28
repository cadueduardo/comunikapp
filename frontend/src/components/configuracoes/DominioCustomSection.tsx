'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  txt_host: string | null;
  txt_valor: string | null;
  ownership_txt_host?: string | null;
  ownership_txt_valor?: string | null;
  ssl_txt_host?: string | null;
  ssl_txt_valor?: string | null;
};

const DEFAULT_CNAME_TARGET = 'customers.comunikapp.com.br';

function statusLabelOf(status: string) {
  if (status === 'VERIFICADO') return 'Pronto para uso';
  if (status === 'PENDENTE') return 'Aguardando configuração do DNS';
  if (status === 'ERRO') return 'DNS ainda incompleto';
  return 'Não configurado';
}

export function DominioCustomSection({
  slug: _slug,
  initialDominio,
  initialStatus,
  initialToken,
  onChanged,
}: DominioCustomSectionProps) {
  const [dominioInput, setDominioInput] = useState(initialDominio ?? '');
  const [status, setStatus] = useState(initialStatus ?? 'NONE');
  const [token, setToken] = useState(initialToken);
  const [instrucoes, setInstrucoes] = useState<Instrucoes | null>(
    initialDominio
      ? {
          cname_host: initialDominio,
          cname_alvo: DEFAULT_CNAME_TARGET,
          txt_host: null,
          txt_valor: initialToken,
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [detalhes, setDetalhes] = useState<string[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);

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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ dominio: dominioInput.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message;
        throw new Error(msg || 'Não foi possível salvar o domínio.');
      }
      setStatus(data.dominio_custom_status || 'PENDENTE');
      setToken(data.dominio_custom_token ?? data.instrucoes?.txt_valor ?? null);
      setInstrucoes(data.instrucoes ?? null);
      setDetalhes([]);
      toast.success('Endereço salvo. Siga o passo a passo do DNS.');
      setGuideOpen(true);
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
        throw new Error(data.message || 'Não foi possível verificar o DNS.');
      }
      setStatus(data.dominio_custom_status || 'ERRO');
      setInstrucoes(data.instrucoes ?? instrucoes);
      setDetalhes(data.verificacao?.detalhes || []);
      if (data.dominio_custom_status === 'VERIFICADO') {
        toast.success('Pronto! Seu endereço próprio está ativo.');
      } else {
        toast.error(
          'Ainda não encontramos o DNS. Confira o passo a passo e tente de novo em alguns minutos.',
        );
        setGuideOpen(true);
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
      toast.success('Endereço próprio removido.');
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover domínio.',
      );
    } finally {
      setBusy(false);
    }
  }

  const host = instrucoes?.cname_host || dominioInput.trim().toLowerCase();
  const cnameAlvo = instrucoes?.cname_alvo || DEFAULT_CNAME_TARGET;
  const ownershipHost =
    instrucoes?.ownership_txt_host || instrucoes?.txt_host;
  const ownershipValor =
    instrucoes?.ownership_txt_valor || instrucoes?.txt_valor;
  const sslHost = instrucoes?.ssl_txt_host;
  const sslValor = instrucoes?.ssl_txt_valor;
  const hasPending = status === 'PENDENTE' || status === 'ERRO' || Boolean(instrucoes);

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Endereço próprio da loja
        </h3>
        <p className="text-sm text-muted-foreground">
          Use um endereço da sua empresa, por exemplo{' '}
          <span className="font-mono text-foreground">
            sistema.minhaloja.com.br
          </span>
          . Status: <strong>{statusLabelOf(status)}</strong>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem configura é o TI ou a pessoa que cuida do domínio da empresa, no
          painel de DNS (Registro.br, Cloudflare, GoDaddy, Hostinger, etc.).{' '}
          <strong>Não é obrigatório criar conta na Cloudflare</strong> — só se o
          DNS da empresa já estiver lá.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dominio-custom">Endereço desejado</Label>
        <Input
          id="dominio-custom"
          value={dominioInput}
          onChange={(e) => setDominioInput(e.target.value.toLowerCase())}
          placeholder="sistema.minhaloja.com.br"
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground">
          Informe com prefixo (sistema., app., erp…). O domínio sozinho (ex.:
          minhaloja.com.br) ainda não é aceito.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void salvar()}
          disabled={busy || !dominioInput.trim()}
        >
          Salvar endereço
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void verificar()}
          disabled={busy || (!token && status === 'NONE')}
        >
          Já configurei o DNS — verificar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setGuideOpen(true)}
          disabled={!host}
        >
          Como configurar o DNS
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

      {hasPending && host ? (
        <p className="text-sm text-muted-foreground">
          Próximo passo: no DNS da empresa, criar um CNAME de{' '}
          <code className="text-foreground">{host}</code> apontando para{' '}
          <code className="text-foreground">{cnameAlvo}</code>. Abra o guia para
          o passo a passo completo.
        </p>
      ) : null}

      {detalhes.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {detalhes.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Como apontar o endereço da loja</DialogTitle>
            <DialogDescription>
              Peça ao TI da empresa (ou a quem gerencia o domínio) para criar os
              registros abaixo no painel de DNS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-3 pl-4">
              <li>
                <span className="font-medium text-foreground">
                  Acesse o painel de DNS do domínio
                </span>
                <p className="mt-1">
                  É o lugar onde a empresa gerencia{' '}
                  <span className="font-mono">minhaloja.com.br</span> (ou o
                  domínio dela): Registro.br, provedor de hospedagem, etc.
                </p>
                <p className="mt-1">
                  Se o DNS já estiver na Cloudflare, entre em{' '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    dash.cloudflare.com
                  </a>{' '}
                  e abra a zona do domínio. Não é necessário abrir conta nova só
                  por causa do ComunikApp.
                </p>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Crie um registro CNAME
                </span>
                <ul className="mt-2 space-y-1 rounded-md bg-muted/50 p-3 font-mono text-xs text-foreground">
                  <li>
                    Tipo: <strong>CNAME</strong>
                  </li>
                  <li>
                    Nome / host:{' '}
                    <strong className="break-all">{host || 'sistema.minhaloja.com.br'}</strong>
                  </li>
                  <li>
                    Destino / aponta para:{' '}
                    <strong className="break-all">{cnameAlvo}</strong>
                  </li>
                </ul>
                <p className="mt-2">
                  Em alguns painéis o “Nome” é só o prefixo (ex.:{' '}
                  <span className="font-mono">sistema</span>), sem repetir o
                  domínio.
                </p>
              </li>
              {(ownershipHost && ownershipValor) || (sslHost && sslValor) ? (
                <li>
                  <span className="font-medium text-foreground">
                    Se o guia pedir TXT, crie também
                  </span>
                  <ul className="mt-2 space-y-2 rounded-md bg-muted/50 p-3 font-mono text-xs text-foreground">
                    {ownershipHost && ownershipValor ? (
                      <li className="break-all">
                        TXT <strong>{ownershipHost}</strong> ={' '}
                        <strong>{ownershipValor}</strong>
                      </li>
                    ) : null}
                    {sslHost && sslValor && sslHost !== ownershipHost ? (
                      <li className="break-all">
                        TXT <strong>{sslHost}</strong> ={' '}
                        <strong>{sslValor}</strong>
                      </li>
                    ) : null}
                  </ul>
                </li>
              ) : (
                <li>
                  <span className="font-medium text-foreground">
                    Aguarde a propagação
                  </span>
                  <p className="mt-1">
                    Pode levar de alguns minutos até algumas horas, conforme o
                    provedor de DNS.
                  </p>
                </li>
              )}
              <li>
                <span className="font-medium text-foreground">
                  Volte aqui e clique em “Já configurei o DNS — verificar”
                </span>
                <p className="mt-1">
                  Quando estiver tudo certo, o status muda para{' '}
                  <strong className="text-foreground">Pronto para uso</strong> e
                  o login passa a funcionar em{' '}
                  <span className="font-mono text-foreground">
                    https://{host || 'sistema.minhaloja.com.br'}
                  </span>
                  .
                </p>
              </li>
            </ol>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGuideOpen(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setGuideOpen(false);
                void verificar();
              }}
              disabled={busy || (!token && status === 'NONE')}
            >
              Já configurei — verificar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
