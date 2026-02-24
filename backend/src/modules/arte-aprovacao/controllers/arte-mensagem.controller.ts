import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ArteMensagemService } from '../services/arte-mensagem.service';
import { CreateMensagemDto, UpdateMensagemDto } from '../dto/mensagem.dto';

@Controller('arte-aprovacao/mensagens')
@UseGuards(JwtAuthGuard)
export class ArteMensagemController {
  constructor(private readonly mensagemService: ArteMensagemService) {}

  /**
   * Criar nova mensagem
   */
  @Post()
  async criarMensagem(@Body() dto: CreateMensagemDto, @Request() req) {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;

    return this.mensagemService.criarMensagem({
      ...dto,
      usuario_id: usuarioId,
      loja_id: lojaId,
    });
  }

  /**
   * Listar mensagens de um produto em uma OS
   */
  @Get('os/:osId/produto/:produtoId')
  async listarMensagensProduto(
    @Param('osId') osId: string,
    @Param('produtoId') produtoId: string,
    @Request() req,
  ) {
    const lojaId = req.user.loja_id;
    return this.mensagemService.listarMensagensProduto(osId, produtoId, lojaId);
  }

  /**
   * Listar mensagens de uma OS (todos os produtos)
   */
  @Get('os/:osId')
  async listarMensagensOS(@Param('osId') osId: string, @Request() req) {
    const lojaId = req.user.loja_id;
    return this.mensagemService.listarMensagensOS(osId, lojaId);
  }

  /**
   * Atualizar mensagem
   */
  @Put(':id')
  async atualizarMensagem(
    @Param('id') id: string,
    @Body() dto: UpdateMensagemDto,
    @Request() req,
  ) {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;

    return this.mensagemService.atualizarMensagem(id, dto, usuarioId, lojaId);
  }

  /**
   * Deletar mensagem
   */
  @Delete(':id')
  async deletarMensagem(@Param('id') id: string, @Request() req) {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;

    return this.mensagemService.deletarMensagem(id, usuarioId, lojaId);
  }

  /**
   * Marcar mensagens específicas como lidas
   */
  @Post('marcar-lidas')
  async marcarMensagensLidas(
    @Body() dto: { mensagemIds: string[] },
    @Request() req,
  ) {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;

    return this.mensagemService.marcarMensagensLidas(
      dto.mensagemIds,
      usuarioId,
      lojaId,
    );
  }

  /**
   * Marcar todas as mensagens de um produto/versão como lidas
   */
  @Post('marcar-lidas-produto')
  async marcarMensagensLidasPorProduto(
    @Body() dto: { os_id: string; produto_id: string; versao_id?: string },
    @Request() req,
  ) {
    const lojaId = req.user.loja_id;

    return this.mensagemService.marcarMensagensLidasPorProduto(
      dto.os_id,
      dto.produto_id,
      dto.versao_id || null,
      lojaId,
    );
  }

  /**
   * Contar mensagens não lidas por produto
   */
  @Get('os/:osId/nao-lidas')
  async contarMensagensNaoLidas(@Param('osId') osId: string, @Request() req) {
    const lojaId = req.user.loja_id;
    return this.mensagemService.contarMensagensNaoLidas(osId, lojaId);
  }

  /**
   * Listar mensagens de uma versão específica
   */
  @Get('versao/:versaoId')
  async listarMensagensVersao(
    @Param('versaoId') versaoId: string,
    @Request() req,
  ) {
    const lojaId = req.user.loja_id;
    return this.mensagemService.listarMensagensVersao(versaoId, lojaId);
  }

  @Get('os/:osId/ultimas-por-produto')
  async buscarUltimasMensagensPorProduto(
    @Param('osId') osId: string,
    @Request() req,
  ) {
    const lojaId = req.user.loja_id;
    return this.mensagemService.buscarUltimasMensagensPorProduto(osId, lojaId);
  }
}
