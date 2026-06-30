'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  ConjuntoCamposForm,
  serializarConjuntoCampos,
  type ConjuntoCamposFormValues,
} from '@/components/forms/catalogo/ConjuntoCamposForm';
import {
  EstampaForm,
  criarEstampaComArteMestra,
  type EstampaFormValues,
} from '@/components/forms/catalogo/EstampaForm';
import {
  ProcessoDecoracaoForm,
  serializarProcessoDecoracao,
  type ProcessoDecoracaoFormValues,
} from '@/components/forms/catalogo/ProcessoDecoracaoForm';
import {
  catalogoConjuntosCamposApi,
  catalogoPersonalizacaoApi,
} from '@/lib/api-client';
import { CatalogoInlineDialogShell } from './CatalogoInlineDialogShell';

type ModalTipo = 'processo' | 'conjunto' | 'estampa' | null;

interface CatalogoInlineCadastroModalsProps {
  onProcessoCriado?: (processo: { id: string; nome: string }) => void;
  onConjuntoCriado?: (conjunto: { id: string; nome: string }) => void;
  onEstampaCriada?: (estampa: {
    id: string;
    nome: string;
    arte_mestra_url?: string | null;
    thumb_url?: string | null;
  }) => void;
  modalAberto: ModalTipo;
  onModalAbertoChange: (modal: ModalTipo) => void;
}

export function CatalogoInlineCadastroModals({
  onProcessoCriado,
  onConjuntoCriado,
  onEstampaCriada,
  modalAberto,
  onModalAbertoChange,
}: CatalogoInlineCadastroModalsProps) {
  const [salvandoProcesso, setSalvandoProcesso] = useState(false);
  const [salvandoConjunto, setSalvandoConjunto] = useState(false);
  const [salvandoEstampa, setSalvandoEstampa] = useState(false);
  const [estampaOptionsKey, setEstampaOptionsKey] = useState(0);
  const [retornarPara, setRetornarPara] = useState<ModalTipo>(null);

  const fechar = () => {
    setRetornarPara(null);
    onModalAbertoChange(null);
  };

  const abrirSubCadastro = (destino: ModalTipo) => {
    setRetornarPara(modalAberto);
    onModalAbertoChange(destino);
  };

  const voltarAposSubCadastro = () => {
    const destino = retornarPara;
    setRetornarPara(null);
    onModalAbertoChange(destino);
  };

  const salvarProcesso = async (data: ProcessoDecoracaoFormValues) => {
    try {
      setSalvandoProcesso(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      const criado = (await catalogoPersonalizacaoApi.create(
        serializarProcessoDecoracao(data),
        token,
      )) as { id: string; nome: string };

      toast.success('Processo de decoração cadastrado.');
      onProcessoCriado?.(criado);
      setEstampaOptionsKey((k) => k + 1);
      if (retornarPara) {
        voltarAposSubCadastro();
      } else {
        fechar();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cadastrar processo.',
      );
    } finally {
      setSalvandoProcesso(false);
    }
  };

  const salvarConjunto = async (data: ConjuntoCamposFormValues) => {
    try {
      setSalvandoConjunto(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      const criado = (await catalogoConjuntosCamposApi.create(
        serializarConjuntoCampos(data),
        token,
      )) as { id: string; nome: string };

      toast.success('Conjunto de campos cadastrado.');
      onConjuntoCriado?.(criado);
      setEstampaOptionsKey((k) => k + 1);
      if (retornarPara) {
        voltarAposSubCadastro();
      } else {
        fechar();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cadastrar conjunto.',
      );
    } finally {
      setSalvandoConjunto(false);
    }
  };

  const salvarEstampa = async (
    data: EstampaFormValues,
    arteMestraPendente?: File | null,
  ) => {
    try {
      setSalvandoEstampa(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Token de autenticação não encontrado.');
        return;
      }

      const criada = await criarEstampaComArteMestra(
        data,
        token,
        arteMestraPendente,
      );

      toast.success(
        arteMestraPendente
          ? 'Estampa cadastrada com arte-mestra enviada.'
          : 'Estampa cadastrada. Você pode enviar a arte-mestra depois em Catálogo → Estampas.',
      );
      onEstampaCriada?.(criada);
      fechar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cadastrar estampa.',
      );
    } finally {
      setSalvandoEstampa(false);
    }
  };

  return (
    <>
      <CatalogoInlineDialogShell
        open={modalAberto === 'processo'}
        onOpenChange={(open) => !open && fechar()}
        title="Cadastrar processo de decoração"
        description="O cadastro é salvo no catálogo sem sair desta página de produto."
      >
        <ProcessoDecoracaoForm
          embedded
          loading={salvandoProcesso}
          onCancel={retornarPara ? voltarAposSubCadastro : fechar}
          onSave={salvarProcesso}
        />
      </CatalogoInlineDialogShell>

      <CatalogoInlineDialogShell
        open={modalAberto === 'conjunto'}
        onOpenChange={(open) => !open && fechar()}
        title="Cadastrar conjunto de campos"
        description="Defina os campos variáveis usados em estampas VDP (nome, data, etc.)."
      >
        <ConjuntoCamposForm
          embedded
          loading={salvandoConjunto}
          onCancel={retornarPara ? voltarAposSubCadastro : fechar}
          onSave={salvarConjunto}
        />
      </CatalogoInlineDialogShell>

      <CatalogoInlineDialogShell
        open={modalAberto === 'estampa'}
        onOpenChange={(open) => !open && fechar()}
        title="Cadastrar estampa"
        description="Cadastre a estampa e selecione-a automaticamente neste produto."
      >
        <EstampaForm
          embedded
          loading={salvandoEstampa}
          onCancel={fechar}
          onSave={salvarEstampa}
          optionsRefreshKey={estampaOptionsKey}
          onCadastrarProcesso={() => abrirSubCadastro('processo')}
          onCadastrarConjunto={() => abrirSubCadastro('conjunto')}
        />
      </CatalogoInlineDialogShell>
    </>
  );
}

export type { ModalTipo as CatalogoModalTipo };
