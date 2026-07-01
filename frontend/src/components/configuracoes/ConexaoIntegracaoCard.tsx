'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LojaConexaoPublica } from '@/lib/conexoes-api';

export interface ConexaoIntegracaoCardProps {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  corIcone: string;
  conexao?: LojaConexaoPublica;
  disponivel?: boolean;
  mensagemIndisponivel?: string;
  rotuloConectar?: string;
  rotuloDesconectar?: string;
  conectando?: boolean;
  onConectar?: () => void;
  onDesconectar?: () => void;
}

export function ConexaoIntegracaoCard({
  titulo,
  descricao,
  icone: Icone,
  corIcone,
  conexao,
  disponivel = true,
  mensagemIndisponivel = 'Em breve',
  rotuloConectar = 'Conectar',
  rotuloDesconectar = 'Desconectar',
  conectando = false,
  onConectar,
  onDesconectar,
}: ConexaoIntegracaoCardProps) {
  const conectado = conexao?.status === 'CONECTADO';

  const badgeVariant = conectado
    ? 'default'
    : conexao?.status === 'ERRO'
      ? 'destructive'
      : 'secondary';

  const statusLabel = conectado
    ? 'Conectado'
    : conexao?.status === 'PENDENTE'
      ? 'Pendente'
      : conexao?.status === 'ERRO'
        ? 'Erro'
        : 'Desconectado';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-lg shrink-0 ${corIcone}`}>
              <Icone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{titulo}</CardTitle>
              <CardDescription className="text-sm mt-1">{descricao}</CardDescription>
            </div>
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        {conectado && conexao?.google_email && (
          <p className="text-sm text-muted-foreground">
            Conta: <span className="text-foreground font-medium">{conexao.google_email}</span>
          </p>
        )}
        {conectado && conexao?.connected_at && (
          <p className="text-xs text-muted-foreground">
            Conectado em{' '}
            {new Date(conexao.connected_at).toLocaleString('pt-BR')}
          </p>
        )}

        {!disponivel ? (
          <Button variant="outline" disabled className="w-full">
            {mensagemIndisponivel}
          </Button>
        ) : conectado ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={conectando}
            onClick={onDesconectar}
          >
            {rotuloDesconectar}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={conectando}
            onClick={onConectar}
          >
            {conectando ? 'Redirecionando…' : rotuloConectar}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
