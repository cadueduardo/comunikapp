'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { osApi } from '@/lib/api-client';

interface MaterialOS {
  item_os_id: string;
  produto: string;
  insumo_id: string;
  nome?: string;
  quantidade_necessaria?: number;
  unidade?: string;
  controle_estoque?: string;
  permite_registrar_sobra?: boolean;
  calculo_chapa?: Record<string, unknown> | null;
  area_considerada?: number | null;
  aproveitamento_previsto?: number | null;
  sobra_estimada?: number | null;
}

interface ItemMateriaisOS {
  item_os_id: string;
  produto: string;
  sobra_acao?: string | null;
  sobra_observacao?: string | null;
  sobra_registrada_id?: string | null;
  materiais: MaterialOS[];
}

interface MateriaisOSResponse {
  os_id: string;
  numero: string;
  controle_estoque: string;
  itens: ItemMateriaisOS[];
}

function formatArea(valor?: number | null): string {
  if (valor == null || !Number.isFinite(valor)) return '—';
  return `${valor.toFixed(2)} m²`;
}

function labelSobraAcao(acao?: string | null): string {
  if (!acao) return 'Pendente';
  if (acao === 'IGNORADA') return 'Ignorada';
  if (acao === 'ANOTADA') return 'Anotada';
  if (acao === 'REGISTRADA') return 'Registrada como retalho';
  return acao;
}

export function OSMateriaisPanel({ osId }: { osId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MateriaisOSResponse | null>(null);
  const [anotarItemId, setAnotarItemId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = (await osApi.getMateriais(osId, token)) as MateriaisOSResponse;
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar materiais da OS');
    } finally {
      setLoading(false);
    }
  }, [osId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const executarAcao = async (
    fn: () => Promise<unknown>,
    mensagemSucesso: string,
  ) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(mensagemSucesso);
      setAnotarItemId(null);
      setObservacao('');
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível concluir a ação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnorar = (itemId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    void executarAcao(
      () => osApi.ignorarSobra(osId, itemId, token),
      'Sobra marcada como ignorada',
    );
  };

  const handleAnotar = (itemId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    void executarAcao(
      () =>
        osApi.anotarSobra(osId, itemId, { observacao: observacao.trim() }, token),
      'Sobra anotada na OS',
    );
  };

  const handleRegistrar = (item: ItemMateriaisOS) => {
    const material =
      item.materiais.find((m) => m.permite_registrar_sobra && m.sobra_estimada) ??
      item.materiais.find((m) => m.calculo_chapa) ??
      item.materiais[0];

    if (!material?.insumo_id) {
      toast.error('Nenhum material elegível para registrar retalho');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    void executarAcao(
      () =>
        osApi.registrarSobra(
          osId,
          item.item_os_id,
          {
            insumoId: material.insumo_id,
            area: material.sobra_estimada ?? undefined,
            observacao: observacao.trim() || undefined,
          },
          token,
        ),
      'Sobra registrada como retalho',
    );
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Carregando materiais previstos...
      </div>
    );
  }

  if (!data?.itens?.length) {
    return (
      <div className="py-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum material previsto encontrado para esta OS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Materiais previstos</h2>
          <p className="text-sm text-muted-foreground">
            OS {data.numero} · controle de estoque: {data.controle_estoque}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void carregar()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {data.itens.map((item) => {
        const temSobra = item.materiais.some(
          (m) => (m.sobra_estimada ?? 0) > 0 || m.calculo_chapa,
        );
        const podeRegistrar = item.materiais.some((m) => m.permite_registrar_sobra);

        return (
          <Card key={item.item_os_id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{item.produto}</CardTitle>
                {temSobra && (
                  <Badge variant="outline">
                    Sobra: {labelSobraAcao(item.sobra_acao)}
                  </Badge>
                )}
              </div>
              {item.sobra_observacao && (
                <p className="text-xs text-muted-foreground">{item.sobra_observacao}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {item.materiais.map((material) => (
                <div
                  key={`${material.item_os_id}-${material.insumo_id}`}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <div className="font-medium">{material.nome ?? 'Material'}</div>
                  <div className="text-muted-foreground text-xs flex flex-wrap gap-3">
                    <span>
                      Qtd: {material.quantidade_necessaria ?? '—'}{' '}
                      {material.unidade ?? ''}
                    </span>
                    <span>Estoque: {material.controle_estoque ?? '—'}</span>
                  </div>
                  {material.calculo_chapa && (
                    <div className="text-xs pt-1 space-y-0.5">
                      <div>Área considerada: {formatArea(material.area_considerada)}</div>
                      <div>
                        Aproveitamento previsto:{' '}
                        {material.aproveitamento_previsto != null
                          ? `${material.aproveitamento_previsto.toFixed(1)}%`
                          : '—'}
                      </div>
                      <div>Sobra estimada: {formatArea(material.sobra_estimada)}</div>
                    </div>
                  )}
                </div>
              ))}

              {temSobra && !item.sobra_acao && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleIgnorar(item.item_os_id)}
                  >
                    Ignorar sobra
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => {
                      setAnotarItemId(item.item_os_id);
                      setObservacao('');
                    }}
                  >
                    Anotar sobra
                  </Button>
                  {podeRegistrar && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleRegistrar(item)}
                    >
                      Registrar como retalho
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={anotarItemId != null}
        onOpenChange={(open) => !open && setAnotarItemId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anotar sobra na OS</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Observação sobre a sobra estimada..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnotarItemId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={actionLoading || !anotarItemId}
              onClick={() => anotarItemId && handleAnotar(anotarItemId)}
            >
              Salvar anotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
