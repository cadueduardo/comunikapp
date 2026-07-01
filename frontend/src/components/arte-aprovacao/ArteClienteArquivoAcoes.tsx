'use client';

import { useState } from 'react';
import { Link2, Loader2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  registrarLinkArteCliente,
  solicitarArteAoCliente,
} from '@/lib/arte-cliente-arquivo-api';
import { toast } from 'sonner';

interface ArteClienteArquivoAcoesProps {
  osId: string;
  itemId: string;
  onMutacao?: () => void;
}

export function ArteClienteArquivoAcoes({
  osId,
  itemId,
  onMutacao,
}: ArteClienteArquivoAcoesProps) {
  const [url, setUrl] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagemEmail, setMensagemEmail] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const handleRegistrarLink = async () => {
    const link = url.trim();
    if (!link) {
      toast.error('Informe a URL do arquivo');
      return;
    }

    setRegistrando(true);
    try {
      await registrarLinkArteCliente(osId, itemId, {
        url: link,
        descricao: descricao.trim() || undefined,
      });
      toast.success('Link registrado. O item passou para arquivo recebido.');
      setUrl('');
      setDescricao('');
      onMutacao?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao registrar link',
      );
    } finally {
      setRegistrando(false);
    }
  };

  const handleSolicitarArte = async () => {
    setEnviandoEmail(true);
    try {
      const result = await solicitarArteAoCliente(osId, itemId, {
        mensagem: mensagemEmail.trim() || undefined,
      });
      const preview = result.data?.preview_url;
      if (preview) {
        toast.success('E-mail enviado (modo teste)', {
          description: 'Clique para abrir o preview do e-mail',
          action: {
            label: 'Abrir preview',
            onClick: () =>
              window.open(preview, '_blank', 'noopener,noreferrer'),
          },
          duration: 15000,
        });
      } else {
        toast.success(`E-mail enviado para ${result.data.enviado_para}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar e-mail',
      );
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-5">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Arquivo do cliente
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Cole um link do Google Drive ou outra URL pública quando o cliente
          enviar o arquivo por outro canal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="arte-link-url">URL do arquivo</Label>
        <Input
          id="arte-link-url"
          type="url"
          placeholder="https://drive.google.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Input
          placeholder="Descrição opcional"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Button
          className="w-full"
          variant="secondary"
          disabled={registrando}
          onClick={() => void handleRegistrarLink()}
        >
          {registrando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Registrar link
        </Button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label htmlFor="arte-email-msg">Solicitar arte ao cliente</Label>
        <Textarea
          id="arte-email-msg"
          rows={3}
          placeholder="Mensagem opcional no e-mail de cobrança..."
          value={mensagemEmail}
          onChange={(e) => setMensagemEmail(e.target.value)}
        />
        <Button
          className="w-full"
          variant="outline"
          disabled={enviandoEmail}
          onClick={() => void handleSolicitarArte()}
        >
          {enviandoEmail ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Enviar e-mail de cobrança
        </Button>
        <p className="text-xs text-muted-foreground">
          Usa o e-mail cadastrado no cliente da OS. Requer SMTP configurado no
          servidor em produção.
        </p>
      </div>
    </div>
  );
}
