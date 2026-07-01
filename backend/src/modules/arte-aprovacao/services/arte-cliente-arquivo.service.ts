import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../../mail/mail.service';
import { GoogleDriveStorageService } from '../../../conexoes/services/google-drive-storage.service';
import { ArteArquivoService } from './arte-arquivo.service';
import { ResponsabilidadeArte } from '../constants/arte.enums';
import {
  registrarLinkArteSchema,
  solicitarArteClienteSchema,
} from '../schemas/arte-cliente-arquivo.schemas';

@Injectable()
export class ArteClienteArquivoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly arteArquivoService: ArteArquivoService,
    private readonly driveStorage: GoogleDriveStorageService,
  ) {}

  async registrarLink(
    lojaId: string,
    osId: string,
    itemId: string,
    usuarioId: string,
    body: unknown,
  ) {
    const parsed = registrarLinkArteSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? 'Dados inválidos',
      );
    }

    const item = await this.obterItemArte(lojaId, osId, itemId);
    const versao = await this.obterOuCriarVersaoCliente(
      lojaId,
      osId,
      itemId,
      usuarioId,
      parsed.data.descricao ?? 'Arquivo registrado via link',
    );

    const driveFileId = await this.driveStorage.resolveFileIdFromUrl(
      parsed.data.url,
    );
    const isDrive = Boolean(driveFileId);
    const nomeArquivo = this.extrairNomeDoLink(parsed.data.url);

    const arquivo = await this.arteArquivoService.addArquivo(
      versao.id,
      {
        nome_arquivo: nomeArquivo,
        nome_original: parsed.data.descricao?.trim() || nomeArquivo,
        tipo_arquivo: this.inferirTipo(nomeArquivo),
        tamanho: BigInt(0),
        url_arquivo: parsed.data.url,
        storage_provider: isDrive ? 'google_drive' : 'link_externo',
        storage_path: driveFileId ?? parsed.data.url,
      },
      lojaId,
    );

    return { versao_id: versao.id, arquivo };
  }

  async solicitarArte(
    lojaId: string,
    osId: string,
    itemId: string,
    body: unknown,
  ) {
    const parsed = solicitarArteClienteSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? 'Dados inválidos',
      );
    }

    const item = await this.obterItemArte(lojaId, osId, itemId);
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId, ativo: true },
      include: {
        cliente: { select: { nome: true, email: true } },
        loja: { select: { nome: true } },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    const emailCliente = os.cliente?.email?.trim();
    if (!emailCliente) {
      throw new BadRequestException(
        'Cliente sem e-mail cadastrado. Atualize o cadastro do cliente antes de solicitar a arte.',
      );
    }

    const info = await this.mailService.sendSolicitacaoArteClienteEmail({
      to: emailCliente,
      clienteNome: os.cliente?.nome ?? 'Cliente',
      lojaNome: os.loja?.nome ?? 'Nossa equipe',
      osNumero: os.numero,
      produtoNome: item.produto_servico,
      mensagemExtra: parsed.data.mensagem,
    });

    return {
      enviado_para: emailCliente,
      produto: item.produto_servico,
      preview_url: info.previewUrl,
    };
  }

  private async obterItemArte(lojaId: string, osId: string, itemId: string) {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemId,
        os_id: osId,
        os: { loja_id: lojaId, ativo: true },
      },
      select: {
        id: true,
        produto_servico: true,
        responsabilidade_arte: true,
        status_arte: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item da OS não encontrado');
    }

    if (item.responsabilidade_arte !== ResponsabilidadeArte.CLIENTE_FORNECE) {
      throw new BadRequestException(
        'Registro de link externo disponível apenas para itens com arte do cliente',
      );
    }

    return item;
  }

  private async obterOuCriarVersaoCliente(
    lojaId: string,
    osId: string,
    itemId: string,
    usuarioId: string,
    descricao: string,
  ) {
    const existente = await this.prisma.arteVersao.findFirst({
      where: {
        os_id: osId,
        servico_id: itemId,
        loja_id: lojaId,
        deletado: false,
      },
      orderBy: { data_criacao: 'asc' },
    });

    if (existente) {
      return existente;
    }

    return this.prisma.arteVersao.create({
      data: {
        os_id: osId,
        servico_id: itemId,
        versao: 'v1',
        status: ArteStatus.RASCUNHO,
        autor_id: usuarioId,
        descricao,
        loja_id: lojaId,
      },
    });
  }

  private extrairNomeDoLink(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const base = pathname.split('/').filter(Boolean).pop();
      return base ? decodeURIComponent(base) : 'arquivo-externo';
    } catch {
      return 'arquivo-externo';
    }
  }

  private inferirTipo(nome: string): string {
    const ext = nome.split('.').pop()?.toLowerCase();
    return ext && ext.length <= 8 ? ext : 'link';
  }
}
