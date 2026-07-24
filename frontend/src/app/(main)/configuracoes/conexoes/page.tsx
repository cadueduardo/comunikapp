'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HardDrive, Loader2, MessageCircle, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConexaoIntegracaoCard } from '@/components/configuracoes/ConexaoIntegracaoCard';
import {
  desconectarGoogle,
  fetchConexoes,
  iniciarGoogleOAuth,
  type LojaConexaoPublica,
} from '@/lib/conexoes-api';
import { configuracoesModuleNav } from '@/lib/module-nav';

export default function ConfiguracoesConexoesPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conectandoGoogle, setConectandoGoogle] = useState(false);
  const [conexoes, setConexoes] = useState<LojaConexaoPublica[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConexoes();
      setConexoes(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao carregar conexões',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const google = searchParams.get('google');
    const mensagem = searchParams.get('mensagem');
    if (google === 'connected') {
      toast.success('Google Drive conectado com sucesso');
      window.history.replaceState({}, '', '/configuracoes/conexoes');
      void carregar();
    } else if (google === 'error') {
      toast.error(mensagem || 'Não foi possível conectar o Google Drive');
      window.history.replaceState({}, '', '/configuracoes/conexoes');
    }
  }, [searchParams, carregar]);

  const googleConexao = conexoes.find((c) => c.tipo === 'GOOGLE_DRIVE');
  const whatsappConexao = conexoes.find((c) => c.tipo === 'WHATSAPP_EVOLUTION');

  const conectarGoogle = async () => {
    setConectandoGoogle(true);
    try {
      const url = await iniciarGoogleOAuth();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao iniciar OAuth Google',
      );
      setConectandoGoogle(false);
    }
  };

  const desconectarGoogleDrive = async () => {
    setConectandoGoogle(true);
    try {
      await desconectarGoogle();
      toast.success('Google Drive desconectado');
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao desconectar',
      );
    } finally {
      setConectandoGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        nav={configuracoesModuleNav}
        title="Hub de Conexões"
        subtitle="Integre serviços externos para armazenamento e comunicação"
        icon={<Plug className="h-8 w-8 text-muted-foreground" />}
        backHref="/configuracoes"
      />

      <Alert>
        <AlertDescription>
          O Google Drive da loja é usado para armazenar arquivos de arte. Os
          uploads do módulo Arte & Aprovação são enviados diretamente ao Drive —
          nada é gravado permanentemente no servidor.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando integrações…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConexaoIntegracaoCard
            titulo="Google Drive"
            descricao="Armazene artes e mídias na conta Google Workspace da loja, com pastas automáticas por cliente e OS."
            icone={HardDrive}
            corIcone="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            conexao={googleConexao}
            conectando={conectandoGoogle}
            onConectar={() => void conectarGoogle()}
            onDesconectar={() => void desconectarGoogleDrive()}
          />
          <ConexaoIntegracaoCard
            titulo="WhatsApp (Evolution API)"
            descricao="Cobrança de arte e comunicação com clientes via WhatsApp."
            icone={MessageCircle}
            corIcone="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
            conexao={whatsappConexao}
            disponivel={false}
            mensagemIndisponivel="Em breve"
          />
        </div>
      )}
    </div>
  );
}
