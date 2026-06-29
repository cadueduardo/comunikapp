'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidacoesAutomaticasCard } from '@/components/configuracoes/ValidacoesAutomaticasCard';
import { IdentificacaoLojaCard } from '@/components/configuracoes/IdentificacaoLojaCard';
import {
  Settings,
  Tag,
  Truck,
  Users,
  Wrench,
  Building2,
  Package,
  Shield,
  Grid3x3,
  Palette,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usuariosApi } from '@/lib/api-client';

type TwoFactorSetup = {
  qrCodeDataUrl: string;
  manualKey: string;
};

function TwoFactorSecurityCard() {
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    const loadStatus = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const status = await usuariosApi.getTwoFactorStatus(token) as { enabled: boolean };
        setEnabled(status.enabled);
      } catch (err) {
        console.error('Erro ao carregar status 2FA:', err);
      }
    };

    loadStatus();
  }, []);

  const startSetup = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await usuariosApi.setupTwoFactor(token) as TwoFactorSetup;
      setSetup(data);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await usuariosApi.confirmTwoFactor(code, token);
      setEnabled(true);
      setSetup(null);
      setCode('');
      setMessage('2FA ativado para sua conta.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codigo 2FA invalido');
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await usuariosApi.disableTwoFactor(password, code, token);
      setEnabled(false);
      setPassword('');
      setCode('');
      setMessage('2FA desativado para sua conta.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel desativar 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card id="seguranca-2fa">
      <CardHeader>
        <CardTitle>Autenticador em dois fatores</CardTitle>
        <CardDescription>
          Proteja sua conta com um codigo temporario do Google Authenticator, 1Password ou Microsoft Authenticator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          Status: <strong>{enabled ? 'Ativo' : 'Inativo'}</strong>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {!enabled && !setup && (
          <Button onClick={startSetup} disabled={loading}>
            Ativar 2FA
          </Button>
        )}

        {!enabled && setup && (
          <div className="space-y-3">
            <img src={setup.qrCodeDataUrl} alt="QR Code 2FA" className="h-44 w-44 rounded border" />
            <div className="space-y-1">
              <Label>Chave manual</Label>
              <code className="block rounded bg-muted p-2 text-xs break-all">{setup.manualKey}</code>
            </div>
            <div className="space-y-2">
              <Label htmlFor="two-factor-confirm">Codigo de 6 digitos</Label>
              <Input
                id="two-factor-confirm"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <Button onClick={confirmSetup} disabled={loading || code.length !== 6}>
              Confirmar e ativar
            </Button>
          </div>
        )}

        {enabled && (
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="two-factor-disable-password">Senha atual</Label>
              <Input
                id="two-factor-disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="two-factor-disable-code">Codigo do autenticador</Label>
              <Input
                id="two-factor-disable-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <Button variant="outline" onClick={disable} disabled={loading || !password || code.length !== 6}>
              Desativar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const [statsValidacoes, setStatsValidacoes] = useState<any>(null);

  useEffect(() => {
    // Carregar estatísticas de validações
    const loadStats = async () => {
      try {
        const response = await fetch('/api/configuracoes/validacoes-automaticas/dashboard');
        const data = await response.json();
        setStatsValidacoes({
          totalRegras: data.totalRegras || 0,
          regrasAtivas: data.regrasAtivas || 0,
          execucoesHoje: data.execucoesHoje || 0,
          taxaSucesso: data.taxaSucesso || 0
        });
      } catch (error) {
        console.error('Erro ao carregar stats:', error);
      }
    };

    loadStats();
  }, []);

  const configuracoes = [
    {
      titulo: 'Categorias de Insumos',
      descricao: 'Gerencie as categorias de insumos',
      href: '/configuracoes/categorias',
      icone: Tag,
      cor: 'bg-blue-100 text-blue-600'
    },
    {
      titulo: 'Fornecedores',
      descricao: 'Cadastro de fornecedores',
      href: '/configuracoes/fornecedores',
      icone: Truck,
      cor: 'bg-purple-100 text-purple-600'
    },
    {
      titulo: 'Funções',
      descricao: 'Gerencie funções e mão de obra',
      href: '/configuracoes/funcoes',
      icone: Users,
      cor: 'bg-orange-100 text-orange-600'
    },
    {
      titulo: 'Máquinas',
      descricao: 'Cadastro de máquinas e equipamentos',
      href: '/configuracoes/maquinas',
      icone: Wrench,
      cor: 'bg-red-100 text-red-600'
    },
    {
      titulo: 'Loja',
      descricao: 'Configurações da loja',
      href: '/configuracoes/loja',
      icone: Building2,
      cor: 'bg-indigo-100 text-indigo-600'
    },
    {
      titulo: 'Tipos de Material',
      descricao: 'Gerencie tipos de material',
      href: '/configuracoes/tipos-material',
      icone: Package,
      cor: 'bg-pink-100 text-pink-600'
    },
    {
      titulo: 'Arte & Aprovação',
      descricao: 'Precificação automática e fila de arte',
      href: '/configuracoes/arte-aprovacao',
      icone: Palette,
      cor: 'bg-violet-100 text-violet-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <IdentificacaoLojaCard />

      {/* Card de Validações Automáticas em destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValidacoesAutomaticasCard stats={statsValidacoes} />
        <TwoFactorSecurityCard />
      </div>

      {/* Grid de outras configurações */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Outras Configurações</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configuracoes.map((config) => {
            const Icone = config.icone;
            return (
              <Link key={config.href} href={config.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${config.cor}`}>
                        <Icone className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.titulo}</CardTitle>
                        <CardDescription className="text-sm">
                          {config.descricao}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
