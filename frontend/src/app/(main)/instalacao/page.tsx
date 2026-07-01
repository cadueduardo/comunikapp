'use client';



import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { InstalacaoCalendario } from '@/components/instalacao/InstalacaoCalendario';

import { InstalacaoOsGrid } from '@/components/instalacao/InstalacaoOsGrid';

import { InstalacaoWorkspaceModal } from '@/components/instalacao/InstalacaoWorkspaceModal';

import { useMediaQuery } from '@/hooks/use-media-query';

import { instalacaoApi } from '@/lib/instalacao/instalacao-api';

import type {

  AgendaInstalacaoEvento,

  OsInstalacaoGridItem,

  StatusInstalacaoOs,

} from '@/lib/instalacao/instalacao.types';

import { IconLoader2, IconRefresh } from '@tabler/icons-react';

import { toast } from 'sonner';



interface WorkspaceMeta {

  osId: string;

  numero: string;

  nomeServico: string;

  clienteNome: string | null;

}



export default function InstalacaoGestaoPage() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const isDesktop = useMediaQuery('(min-width: 1024px)');



  const [itens, setItens] = useState<OsInstalacaoGridItem[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState('');

  const [buscaDebounced, setBuscaDebounced] = useState('');

  const [statusFiltro, setStatusFiltro] = useState('todos');

  const [abaAtiva, setAbaAtiva] = useState('lista');

  const [workspaceAberto, setWorkspaceAberto] = useState(false);

  const [workspaceMeta, setWorkspaceMeta] = useState<WorkspaceMeta | null>(null);

  const reidratandoRef = useRef(false);
  const fechandoWorkspaceRef = useRef(false);



  useEffect(() => {

    const timer = setTimeout(() => setBuscaDebounced(busca.trim()), 400);

    return () => clearTimeout(timer);

  }, [busca]);



  const carregar = useCallback(async () => {

    setCarregando(true);

    try {

      const statusApi =

        statusFiltro !== 'todos' && statusFiltro !== 'sem_status'

          ? (statusFiltro as StatusInstalacaoOs)

          : undefined;



      const resposta = await instalacaoApi.listarOsInstalacao({

        status: statusApi,

        busca: buscaDebounced || undefined,

      });



      let lista = resposta.itens;

      if (statusFiltro === 'sem_status') {

        lista = lista.filter((item) => !item.status_instalacao_os);

      }



      setItens(lista);

    } catch (err) {

      toast.error(

        err instanceof Error

          ? err.message

          : 'Falha ao carregar ordens de serviço',

      );

    } finally {

      setCarregando(false);

    }

  }, [buscaDebounced, statusFiltro]);



  const recarregarGrid = useCallback(() => {

    void carregar();

  }, [carregar]);



  useEffect(() => {

    void carregar();

  }, [carregar]);



  const abrirWorkspace = useCallback(

    (item: OsInstalacaoGridItem) => {

      setWorkspaceMeta({

        osId: item.os_id,

        numero: item.numero,

        nomeServico: item.nome_servico,

        clienteNome: item.cliente_nome,

      });

      setWorkspaceAberto(true);

      router.replace(`/instalacao?os=${item.os_id}`, { scroll: false });

    },

    [router],

  );



  const abrirWorkspacePorEvento = useCallback(

    (evento: AgendaInstalacaoEvento) => {

      setWorkspaceMeta({

        osId: evento.os_id,

        numero: evento.os_numero,

        nomeServico: evento.nome_servico,

        clienteNome: evento.cliente_nome,

      });

      setWorkspaceAberto(true);

      router.replace(`/instalacao?os=${evento.os_id}`, { scroll: false });

    },

    [router],

  );



  const fecharWorkspace = useCallback(() => {
    fechandoWorkspaceRef.current = true;
    setWorkspaceAberto(false);
    if (searchParams.get('os')) {
      router.replace('/instalacao', { scroll: false });
    } else {
      fechandoWorkspaceRef.current = false;
      setWorkspaceMeta(null);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const osIdUrl = searchParams.get('os');
    if (!osIdUrl) {
      fechandoWorkspaceRef.current = false;
      setWorkspaceAberto(false);
      setWorkspaceMeta(null);
      return;
    }

    if (fechandoWorkspaceRef.current) {
      return;
    }

    if (workspaceMeta?.osId === osIdUrl) {
      setWorkspaceAberto(true);
      return;
    }

    const itemGrid = itens.find((item) => item.os_id === osIdUrl);
    if (itemGrid) {
      setWorkspaceMeta({
        osId: itemGrid.os_id,
        numero: itemGrid.numero,
        nomeServico: itemGrid.nome_servico,
        clienteNome: itemGrid.cliente_nome,
      });
      setWorkspaceAberto(true);
      return;
    }

    if (reidratandoRef.current) {
      return;
    }

    reidratandoRef.current = true;
    instalacaoApi
      .obterPainelOs(osIdUrl)
      .then((painel) => {
        setWorkspaceMeta({
          osId: painel.os.id,
          numero: painel.os.numero,
          nomeServico: painel.os.nome_servico,
          clienteNome: painel.os.cliente_nome,
        });
        setWorkspaceAberto(true);
      })
      .catch(() => {
        toast.error('Não foi possível abrir a OS de instalação solicitada.');
        router.replace('/instalacao', { scroll: false });
      })
      .finally(() => {
        reidratandoRef.current = false;
      });
  }, [searchParams, itens, workspaceMeta?.osId, router]);



  const totalExibido = useMemo(() => itens.length, [itens]);



  const gridOs = (

    <div className="min-w-0 space-y-3">

      {!carregando && (

        <p className="text-xs text-muted-foreground">

          {totalExibido} ordem(ns) de serviço com instalação

        </p>

      )}

      <InstalacaoOsGrid

        itens={itens}

        carregando={carregando}

        busca={busca}

        statusFiltro={statusFiltro}

        onBuscaChange={setBusca}

        onStatusFiltroChange={setStatusFiltro}

        onSelecionarOs={abrirWorkspace}

      />

    </div>

  );



  return (

    <div className="flex w-full min-w-0 flex-col gap-6 overflow-x-hidden p-4 md:p-6">

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <h1 className="text-2xl font-bold text-foreground">Instalações</h1>

          <p className="text-sm text-muted-foreground">

            Gestão operacional por ordem de serviço — lotes, agenda e campo

          </p>

        </div>

        <Button

          type="button"

          variant="outline"

          disabled={carregando}

          onClick={() => void carregar()}

        >

          {carregando ? (

            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />

          ) : (

            <IconRefresh className="mr-2 h-4 w-4" />

          )}

          Atualizar lista

        </Button>

      </div>



      {isDesktop ? (

        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">

          {gridOs}

          <div className="min-w-0 lg:sticky lg:top-4">

            <InstalacaoCalendario

              compacto

              onEventoClick={abrirWorkspacePorEvento}

            />

          </div>

        </div>

      ) : (

        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">

          <TabsList className="border border-border bg-muted">

            <TabsTrigger value="lista">Lista de OS</TabsTrigger>

            <TabsTrigger value="calendario">Calendário</TabsTrigger>

          </TabsList>



          <TabsContent value="lista" className="mt-4">

            {gridOs}

          </TabsContent>



          <TabsContent value="calendario" className="mt-4">

            <InstalacaoCalendario onEventoClick={abrirWorkspacePorEvento} />

          </TabsContent>

        </Tabs>

      )}



      {workspaceMeta && (

        <InstalacaoWorkspaceModal

          open={workspaceAberto}

          onClose={fecharWorkspace}

          osId={workspaceMeta.osId}

          osNumero={workspaceMeta.numero}

          nomeServico={workspaceMeta.nomeServico}

          clienteNome={workspaceMeta.clienteNome}

          onMutacao={recarregarGrid}

        />

      )}

    </div>

  );

}

