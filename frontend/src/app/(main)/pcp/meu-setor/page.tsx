'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilaOperador } from '@/components/pcp/FilaOperador';
import { useMeuSetor } from '@/hooks/useMeuSetor';
import {
  IconBuilding,
  IconRefresh,
  IconUser,
  IconClock,
  IconAlertTriangle,
  IconSettings,
} from '@tabler/icons-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MeuSetorPage() {
  const {
    setor,
    fila,
    loading,
    error,
    operadorId,
    lastRefresh,
    setoresDisponiveis,
    isAdministrador,
    setorSelecionadoId,
    selecionarSetor,
    refreshData,
    iniciarProducao,
    concluirEtapa,
    pausarProducao,
  } = useMeuSetor();

  const handleRefresh = async () => {
    await refreshData();
  };

  const setorSelector =
    isAdministrador && setoresDisponiveis.length > 0 ? (
      <Select
        value={setorSelecionadoId ?? undefined}
        onValueChange={(value) => selecionarSetor(value)}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecione um setor" />
        </SelectTrigger>
        <SelectContent>
          {setoresDisponiveis.map((setorOption) => (
            <SelectItem key={setorOption.id} value={setorOption.id}>
              {setorOption.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  if (loading && !setor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconBuilding className="h-6 w-6" />
              {isAdministrador ? 'Supervisão de Setores' : 'Meu Setor'}
            </h1>
            <p className="text-gray-600">
              {isAdministrador
                ? 'Visualize e acompanhe a fila de produção de qualquer setor'
                : 'Visualização da fila de produção do seu setor'}
            </p>
          </div>
          {setorSelector}
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados do setor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !setor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconBuilding className="h-6 w-6" />
              {isAdministrador ? 'Supervisão de Setores' : 'Meu Setor'}
            </h1>
            <p className="text-gray-600">
              {isAdministrador
                ? 'Visualize e acompanhe a fila de produção de qualquer setor'
                : 'Visualização da fila de produção do seu setor'}
            </p>
          </div>
          {setorSelector}
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <IconAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <IconRefresh className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!setor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconBuilding className="h-6 w-6" />
              {isAdministrador ? 'Supervisão de Setores' : 'Meu Setor'}
            </h1>
            <p className="text-gray-600">
              {isAdministrador
                ? 'Visualize e acompanhe a fila de produção de qualquer setor'
                : 'Visualização da fila de produção do seu setor'}
            </p>
          </div>
          {setorSelector}
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <IconBuilding className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {isAdministrador
                ? 'Nenhum setor cadastrado'
                : 'Nenhum setor atribuído'}
            </h3>
            <p className="text-gray-500">
              {isAdministrador
                ? 'Cadastre setores produtivos ou selecione um setor para visualizar a fila de produção.'
                : 'Você não possui nenhum setor produtivo atribuído. Entre em contato com o administrador.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const itensPendentes = fila.filter((item) => item.status === 'PENDENTE').length;
  const itensEmAndamento = fila.filter(
    (item) => item.status === 'EM_ANDAMENTO',
  ).length;
  const itensPausados = fila.filter((item) => item.status === 'PAUSADA').length;
  const itensAtrasados = fila.filter((item) => {
    if (!item.data_prazo) return false;
    return new Date(item.data_prazo) < new Date() && item.status !== 'CONCLUIDA';
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconBuilding className="h-6 w-6" />
            {isAdministrador ? 'Supervisão de Setores' : 'Meu Setor'}
          </h1>
          <p className="text-gray-600">
            {isAdministrador
              ? 'Visualize e acompanhe a fila de produção de qualquer setor'
              : 'Visualização da fila de produção do seu setor'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {setorSelector}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <IconSettings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Informações do setor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: setor.cor }}
            />
            {setor.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {fila.length}
              </div>
              <div className="text-sm text-gray-600">Total na Fila</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {itensPendentes}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {itensEmAndamento}
              </div>
              <div className="text-sm text-gray-600">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {itensAtrasados}
              </div>
              <div className="text-sm text-gray-600">Atrasados</div>
            </div>
          </div>

          {setor.descricao && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">{setor.descricao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações do operador */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconUser className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">
                {isAdministrador
                  ? 'Modo administrador'
                  : operadorId
                  ? `Operador: ID ${operadorId}`
                  : 'Operador não identificado'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <IconClock className="h-4 w-4" />
              <span>
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas importantes */}
      {(itensAtrasados > 0 || itensPausados > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">
                  Atenção Necessária
                </h3>
                <p className="text-sm text-orange-700">
                  {itensAtrasados > 0 && `${itensAtrasados} item(s) atrasado(s)`}
                  {itensAtrasados > 0 && itensPausados > 0 && ' · '}
                  {itensPausados > 0 && `${itensPausados} item(s) pausado(s)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila de produção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fila de Produção</span>
            <Badge variant="secondary">{fila.length} item(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilaOperador
            fila={fila}
            loading={loading}
            onIniciarProducao={iniciarProducao}
            onConcluirEtapa={concluirEtapa}
            onPausarProducao={pausarProducao}
          />
        </CardContent>
      </Card>

      {/* Erros persistentes */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Erro ao carregar dados
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

