import { Body, Controller, Get, Post, Logger, Param } from '@nestjs/common';
import { ArteMensagemService } from '../services/arte-mensagem.service';
import { ArteLinkAprovacaoService } from '../services/arte-link-aprovacao.service';
import { CreateMensagemPublicoDto } from '../dto/mensagem-publica.dto';
import { AutorTipo } from '@prisma/client';

@Controller('arte-aprovacao/mensagens/publico')
export class ArteMensagemPublicController {
  private readonly logger = new Logger(ArteMensagemPublicController.name);

  constructor(
    private readonly mensagemService: ArteMensagemService,
    private readonly linkAprovacaoService: ArteLinkAprovacaoService,
  ) {}

  @Post(':token')
  async criarMensagemComToken(
    @Param('token') token: string,
    @Body() dto: CreateMensagemPublicoDto,
  ) {
    try {
      this.logger.log(`Nova mensagem com token recebida: ${token}`);

      // Validar token de aprovação
      const linkAprovacao =
        await this.linkAprovacaoService.getLinkContextParaMensagemPublica(
          token,
        );

      if (!linkAprovacao) {
        throw new Error('Token de aprovação inválido ou expirado');
      }

      // Verificar se o link está ativo - DESABILITADO temporariamente para debug
      // if (!linkAprovacao.ativo) {
      //   throw new Error('Link de aprovação não está mais ativo');
      // }

      // Verificar se o token não expirou
      if (linkAprovacao.expira_em && new Date() > linkAprovacao.expira_em) {
        throw new Error('Token de aprovação expirado');
      }

      // Buscar dados da versão se versao_id foi fornecido
      let versaoId = dto.versao_id;
      if (!versaoId && linkAprovacao.versao_id) {
        versaoId = linkAprovacao.versao_id;
      }

      // Criar mensagem usando o serviço existente
      // Para cliente público, não passamos usuario_id (será null no banco)
      const dadosMensagem = {
        os_id: linkAprovacao.versao.os_id,
        produto_id: dto.produto_id || linkAprovacao.versao.servico_id, // Usar produto_id do DTO ou da versão
        versao_id: versaoId,
        mensagem: dto.mensagem,
        autor_tipo: 'CLIENTE' as AutorTipo,
        autor_nome:
          dto.autor_nome || linkAprovacao.versao.os.cliente.nome || 'Cliente',
        autor_email:
          dto.autor_email || linkAprovacao.versao.os.cliente.email || '',
        lida: false,
        loja_id: linkAprovacao.versao.loja_id,
        usuario_id: null as any, // Cliente público não tem usuario_id
      };

      this.logger.log(
        `📝 Criando mensagem pública com dados: ${JSON.stringify({
          ...dadosMensagem,
          mensagem: dadosMensagem.mensagem.substring(0, 50) + '...',
        })}`,
      );

      const mensagemCriada =
        await this.mensagemService.criarMensagem(dadosMensagem);

      this.logger.log(
        `✅ Mensagem com token criada com sucesso: ${mensagemCriada.id}`,
      );

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: {
          id: mensagemCriada.id,
          mensagem: mensagemCriada.mensagem,
          autor_nome: mensagemCriada.autor_nome,
          created_at: mensagemCriada.created_at,
          versao_id: versaoId,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao criar mensagem com token:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  @Get(':token/versao/:versaoId')
  async listarMensagensPublico(
    @Param('token') token: string,
    @Param('versaoId') versaoId: string,
  ) {
    try {
      this.logger.log(
        `Listando mensagens públicas para token: ${token}, versão: ${versaoId}`,
      );

      // Validar token de aprovação
      const linkAprovacao =
        await this.linkAprovacaoService.getLinkContextParaMensagemPublica(
          token,
        );

      const versao = await this.mensagemService.validarVersaoMesmaOsDoLink(
        versaoId,
        linkAprovacao.versao.os_id,
        linkAprovacao.versao.loja_id,
      );

      if (!versao) {
        throw new Error('Versão não pertence a esta ordem de serviço');
      }

      // Buscar mensagens da versão específica
      const mensagens = await this.mensagemService.listarMensagensVersao(
        versaoId,
        linkAprovacao.versao.loja_id,
      );

      this.logger.log(
        `Encontradas ${mensagens.length} mensagens para versão ${versaoId}`,
      );

      return {
        success: true,
        data: mensagens,
      };
    } catch (error) {
      this.logger.error('Erro ao listar mensagens públicas:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor',
        data: [],
      };
    }
  }
}
