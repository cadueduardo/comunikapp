'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfigArte {
  ativo: boolean;
  modelo_precificacao: string;
  cobranca_padrao: string;
  horas_padrao_criacao: number;
  horas_padrao_adaptacao: number;
  exibir_linha_pdf: boolean;
  permitir_edicao_orcamentista: boolean;
  configurado?: boolean;
  servico_arte?: { custo_hora: number | string };
}

export default function ConfiguracaoArteAprovacaoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigArte | null>(null);
  const [custoHora, setCustoHora] = useState('');
  const [alertaStatus, setAlertaStatus] = useState<string | undefined>();

  const carregar = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    try {
      const [resConfig, resStatus] = await Promise.all([
        fetch('/api/arte-aprovacao/configuracao', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/arte-aprovacao/configuracao/status', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const jsonConfig = await resConfig.json();
      const jsonStatus = await resStatus.json();

      if (!resConfig.ok) {
        throw new Error(jsonConfig.message || 'Erro ao carregar configuração');
      }

      const data = jsonConfig.data as ConfigArte;
      setConfig(data);
      setCustoHora(String(data.servico_arte?.custo_hora ?? '0'));
      setAlertaStatus(jsonStatus.data?.alerta);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar configuração',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async () => {
    if (!config) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setSaving(true);
    try {
      const body = {
        ativo: config.ativo,
        modelo_precificacao: config.modelo_precificacao || 'HORA',
        cobranca_padrao: config.cobranca_padrao,
        horas_padrao_criacao: Number(config.horas_padrao_criacao),
        horas_padrao_adaptacao: Number(config.horas_padrao_adaptacao),
        exibir_linha_pdf: config.exibir_linha_pdf ?? true,
        permitir_edicao_orcamentista: config.permitir_edicao_orcamentista,
        custo_hora_servico: Number(custoHora) || 0,
      };

      const res = await fetch('/api/arte-aprovacao/configuracao', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erro ao salvar');
      }

      toast.success('Configuração de Arte & Aprovação salva');
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/configuracoes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Arte & Aprovação</h1>
          <p className="text-muted-foreground text-sm">
            Precificação automática de criação de arte nos orçamentos (modelo por hora)
          </p>
        </div>
      </div>

      {alertaStatus && (
        <Alert>
          <AlertDescription>{alertaStatus}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Precificação</CardTitle>
          <CardDescription>
            O custo é calculado como horas × custo/hora do serviço sistêmico.
            Orçamentos sem esta configuração usam R$ 0,00 com alerta visual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Módulo ativo</Label>
            <Switch
              id="ativo"
              checked={config.ativo}
              onCheckedChange={(ativo) => setConfig({ ...config, ativo })}
            />
          </div>

          <div className="space-y-2">
            <Label>Custo por hora (serviço sistêmico)</Label>
            <CustomCurrencyInput
              value={custoHora}
              onValueChange={setCustoHora}
              placeholder="R$ 0,00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horas padrão — criação</Label>
              <Input
                type="number"
                min={0}
                step={0.25}
                value={config.horas_padrao_criacao}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    horas_padrao_criacao: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Horas padrão — adaptação</Label>
              <Input
                type="number"
                min={0}
                step={0.25}
                value={config.horas_padrao_adaptacao}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    horas_padrao_adaptacao: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cobrança padrão em novos produtos</Label>
            <Select
              value={config.cobranca_padrao}
              onValueChange={(cobranca_padrao) =>
                setConfig({ ...config, cobranca_padrao })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCLUIDA_NO_PRODUTO">
                  Incluída no produto (oculta no PDF)
                </SelectItem>
                <SelectItem value="COBRADA_A_PARTE">Cobrada à parte</SelectItem>
                <SelectItem value="SEM_CUSTO">Sem cobrança (cortesia)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="permitir_edicao">
              Permitir orçamentista editar horas automáticas
            </Label>
            <Switch
              id="permitir_edicao"
              checked={config.permitir_edicao_orcamentista}
              onCheckedChange={(permitir_edicao_orcamentista) =>
                setConfig({ ...config, permitir_edicao_orcamentista })
              }
            />
          </div>

          <Button onClick={salvar} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar configuração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
