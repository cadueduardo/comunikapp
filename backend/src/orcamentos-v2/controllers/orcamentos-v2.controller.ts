import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  NotImplementedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, extrairIdentidadeAutenticada } from '../../auth/decorators';
import { OrcamentosV2Service } from '../services/orcamentos-v2.service';
import { IntegracaoMotorService } from '../services/integracao-motor.service';
import { ValidacaoEstoqueService } from '../services/validacao-estoque.service';
import { InsumosAutocompleteService } from '../services/insumos-autocomplete.service';
import { NotificacoesService } from '../../notificacoes/notificacoes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { extrairContextoDaRequisicao } from '../../common/security/contexto-requisicao';
import { SimularChapaDto } from '../../common/calculo-chapa/simular-chapa.dto';
import { OrcamentoOrigemSobraService } from '../services/orcamento-origem-sobra.service';
import { AcaoClientePublicoDto } from '../dto/acao-cliente-publico.dto';
import {
  AtualizarOrcamentoBodyDto,
  CriarOrcamentoBodyDto,
} from '../dto/orcamento-body.dto';

/** Pipe local: tipa o body sem descartar campos ainda fora do DTO canônico. */
const BODY_PIPE_EXPANSIVO = new ValidationPipe({
  transform: true,
  whitelist: false,
  forbidNonWhitelisted: false,
});

/**
 * Controller Principal de Orçamentos V2
 * Implementa todos os endpoints CRUD usando motor de cálculo V2
 *
 * ✅ INTEGRAÇÃO COMPLETA COM MOTOR FUNCIONANDO
 * ✅ ENDPOINTS DOCUMENTADOS COM SWAGGER
 *
 * Autorização (Gate 0S): `VendasPermissionsGuard` nega por padrão. Todo
 * endpoint autenticado declara sua permissão com `@RequerPermissaoVendas`.
 * O antigo `@Roles` foi removido daqui porque nunca autorizou nada.
 */
@ApiTags('Orçamentos V2')
@Controller('orcamentos-v2')
@ApiBearerAuth()
@UseGuards(VendasPermissionsGuard)
export class OrcamentosV2Controller {
  constructor(
    private readonly orcamentosService: OrcamentosV2Service,
    private readonly integracaoMotor: IntegracaoMotorService,
    private readonly validacaoEstoque: ValidacaoEstoqueService,
    private readonly insumosAutocomplete: InsumosAutocompleteService,
    private readonly notificacoesService: NotificacoesService,
    private readonly origemSobraService: OrcamentoOrigemSobraService,
  ) {}

  /**
   * Reenviar código de aprovação - DEVE SER PRIMEIRA ROTA PÚBLICA
   *
   * Gate 0S / HS-04: rota anônima. O rate limit por (orçamento, IP) está em
   * `main.ts` e evita usá-la como gerador de spam contra o e-mail do cliente;
   * a resposta é sempre a mesma, para não revelar se o orçamento existe ou
   * tem cliente com e-mail.
   */
  @Post(':id/reenviar-codigo')
  @Public()
  @ApiOperation({ summary: 'Reenviar código de aprovação' })
  @ApiResponse({ status: 200, description: 'Solicitação registrada' })
  @ApiResponse({ status: 429, description: 'Tentativas em excesso' })
  async reenviarCodigoAprovacao(@Param('id') id: string) {
    return await this.orcamentosService.reenviarCodigoAprovacao(id);
  }

  /**
   * Cria novo orçamento
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_CRIAR)
  @ApiOperation({ summary: 'Criar novo orçamento' })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async criarOrcamento(
    @Body(BODY_PIPE_EXPANSIVO) dados: CriarOrcamentoBodyDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.criarOrcamento(
      dados,
      lojaId,
      usuarioId,
    );
  }

  // ===== ENDPOINTS DE NOTIFICAÇÕES V2 =====
  @Get('notificacoes')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Listar notificações da loja' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarNotificacoes(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    const limitNumber = limit ? parseInt(limit) : 50;
    const offsetNumber = offset ? parseInt(offset) : 0;
    return this.notificacoesService.buscarNotificacoes(
      lojaId,
      usuarioId,
      limitNumber,
      offsetNumber,
    );
  }

  /**
   * Busca notificações não visualizadas
   */
  @Get('notificacoes/nao-visualizadas')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Listar notificações não visualizadas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações não visualizadas',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarNaoVisualizadas(@Request() req: any) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.notificacoesService.buscarNaoVisualizadas(lojaId, usuarioId);
  }

  /**
   * Conta notificações não visualizadas
   */
  @Get('notificacoes/nao-visualizadas/count')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Contar notificações não visualizadas' })
  @ApiResponse({
    status: 200,
    description: 'Contador de notificações não visualizadas',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async contarNaoVisualizadas(@Request() req: any) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    const count = await this.notificacoesService.contarNaoVisualizadas(
      lojaId,
      usuarioId,
    );
    return { count };
  }

  /**
   * Marca notificação como visualizada
   */
  @Patch('notificacoes/:id/visualizar')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Marcar notificação como visualizada' })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como visualizada',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async marcarComoVisualizada(@Param('id') id: string, @Request() req: any) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    await this.notificacoesService.marcarComoVisualizada(id, lojaId, usuarioId);
    return { message: 'Notificação marcada como visualizada' };
  }

  /**
   * Marca todas as notificações como visualizadas
   */
  @Patch('notificacoes/visualizar-todas')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Marcar todas as notificações como visualizadas' })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações foram marcadas como visualizadas',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async marcarTodasComoVisualizadas(@Request() req: any) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    await this.notificacoesService.marcarTodasComoVisualizadas(
      lojaId,
      usuarioId,
    );
    return {
      message: 'Todas as notificações foram marcadas como visualizadas',
    };
  }

  /**
   * Deleta notificação
   */
  @Delete('notificacoes/:id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  @ApiResponse({ status: 204, description: 'Notificação deletada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async deletarNotificacao(@Param('id') id: string, @Request() req: any) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    await this.notificacoesService.deletarNotificacao(id, lojaId, usuarioId);
  }

  // ===== ENDPOINTS DE CHAT V2 =====
  /**
   * Buscar mensagens do chat (autenticado) - SEGUINDO PADRÃO DO LEGADO
   */
  @Get(':id/mensagens')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Buscar mensagens do chat (autenticado)' })
  @ApiResponse({ status: 200, description: 'Mensagens encontradas' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarMensagensChat(@Param('id') id: string, @Request() req: any) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.buscarMensagensChatLegado(id, lojaId);
  }

  /**
   * Enviar mensagem no chat (autenticado - para vendedores) - SEGUINDO PADRÃO DO LEGADO
   */
  @Post(':id/mensagens')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiOperation({ summary: 'Enviar mensagem no chat (autenticado)' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async enviarMensagemChat(
    @Param('id') id: string,
    @Request() req: any,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);

    // Criar DTO manualmente a partir do body
    const dados = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'VENDEDOR',
      anexos: file ? [file.originalname] : undefined,
    };

    return await this.orcamentosService.enviarMensagemChatLegado(
      id,
      dados,
      lojaId,
      usuarioId,
      file,
    );
  }

  /**
   * Marcar mensagem como lida (autenticado)
   */
  @Post('chat/:id/mensagens/:mensagemId/visualizar')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Marcar mensagem como lida (autenticado)' })
  @ApiResponse({ status: 200, description: 'Mensagem marcada como lida' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async marcarMensagemComoLida(
    @Param('id') id: string,
    @Param('mensagemId') mensagemId: string,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.marcarMensagemVisualizada(
      id,
      mensagemId,
      usuarioId,
      lojaId,
    );
  }

  // ===== ENDPOINTS PÚBLICOS V2 =====
  /**
   * Buscar orçamento público (sem autenticação)
   */
  @Get(':id/publico')
  @Public()
  @ApiOperation({ summary: 'Buscar orçamento público' })
  @ApiResponse({ status: 200, description: 'Orçamento público encontrado' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarOrcamentoPublico(@Param('id') id: string) {
    return await this.orcamentosService.buscarOrcamentoPublico(id);
  }

  /**
   * Processar ação do cliente público
   *
   * Gate 0S / HS-03 e HS-04: rota anônima com DTO tipado (antes era
   * `@Body() dados: {...}` inline, que desliga a `ValidationPipe` global) e
   * erro público genérico. A aprovação exige o código de uso único enviado ao
   * cliente. O rate limit por (orçamento, IP) está em `main.ts`.
   */
  @Post(':id/publico/acao')
  @Public()
  @ApiOperation({ summary: 'Processar ação do cliente público' })
  @ApiResponse({ status: 200, description: 'Ação processada com sucesso' })
  @ApiResponse({ status: 400, description: 'Ação recusada' })
  @ApiResponse({ status: 429, description: 'Tentativas em excesso' })
  async processarAcaoClientePublico(
    @Param('id') id: string,
    @Body() dados: AcaoClientePublicoDto,
    @Request() req: any,
  ) {
    return await this.orcamentosService.processarAcaoClientePublico(
      id,
      dados,
      extrairContextoDaRequisicao(req),
    );
  }

  /**
   * Chat da proposta pelo caminho `.../publico`.
   *
   * Estes três endpoints declaravam `@Public()`, mas o `JwtGlobalMiddleware`
   * nunca os liberou: o catálogo de rotas públicas só abre `:id/publico`,
   * `:id/publico/acao` e `:id/reenviar-codigo`. Na prática eles já respondiam
   * `401`. O Gate 0S torna a declaração honesta — permanecem autenticados —
   * em vez de ampliar a fronteira pública sem DTO, rate limit e vínculo de
   * token. O contrato do chat com o cliente final é das fases funcionais.
   */
  @Get(':id/mensagens/publico')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Buscar mensagens do chat da proposta' })
  @ApiResponse({ status: 200, description: 'Mensagens encontradas' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarMensagensChatPublico(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.buscarMensagensPublicasLegado(
      id,
      lojaId,
    );
  }

  @Post(':id/mensagens/publico')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiOperation({ summary: 'Enviar mensagem no chat da proposta' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async enviarMensagemChatPublico(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    )
    body: any,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    // Criar DTO manualmente a partir do body
    const dados = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'CLIENTE',
      autor_nome: body.autor_nome || 'Cliente',
      autor_email: body.autor_email || '',
    };

    return await this.orcamentosService.enviarMensagemPublicaLegadoComAnexo(
      id,
      lojaId,
      dados,
      file,
      usuarioId,
    );
  }

  @Post(':id/publico/mensagens/:mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Marcar mensagem da proposta como lida' })
  @ApiResponse({ status: 200, description: 'Mensagem marcada como lida' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async marcarMensagemComoLidaPublico(
    @Param('id') id: string,
    @Param('mensagemId') mensagemId: string,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.marcarMensagemVisualizadaPublica(
      id,
      mensagemId,
      lojaId,
      usuarioId,
    );
  }

  @Post(':id/itens/:itemId/simular-chapa')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({ summary: 'Simular cálculo da chapa para item do orçamento' })
  async simularChapaItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dados: SimularChapaDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return this.orcamentosService.simularChapaItem(
      id,
      itemId,
      dados,
      lojaId,
      usuarioId,
    );
  }

  @Put(':id/itens/:itemId/calculo-chapa')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({
    summary: 'Salvar cálculo da chapa congelado no item do orçamento',
  })
  async salvarCalculoChapaItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dados: SimularChapaDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return this.orcamentosService.salvarCalculoChapaItem(
      id,
      itemId,
      dados,
      lojaId,
      usuarioId,
    );
  }

  @Get('origem-sobra/busca')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Buscar orçamentos para origem de sobra/retalho',
  })
  async buscarOrcamentosOrigemSobra(
    @Query('q') q: string,
    @Query('limite') limite: string,
    @Request() req: any,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.origemSobraService.buscarOrcamentos(
      lojaId,
      q,
      limite ? Number(limite) : 20,
    );
  }

  @Get(':id/candidatos-sobra')
  @UseGuards(JwtAuthGuard)
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({
    summary: 'Listar materiais candidatos a sobra de um orçamento',
  })
  async listarCandidatosSobraOrcamento(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.origemSobraService.listarCandidatosSobra(lojaId, id);
  }

  /**
   * Busca orçamento por ID
   */
  @Get(':id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  @ApiResponse({ status: 200, description: 'Orçamento encontrado' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarOrcamento(@Param('id') id: string, @Request() req: any) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.buscarOrcamento(id, lojaId);
  }

  /**
   * Lista orçamentos com filtros
   */
  @Get()
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Listar orçamentos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async listarOrcamentos(
    @Query() filtros: any,
    @Query() paginacao: any,
    @Request() req: any,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.listarOrcamentos(
      lojaId,
      filtros,
      paginacao,
    );
  }

  /**
   * Atualiza orçamento existente
   */
  @Put(':id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({ summary: 'Atualizar orçamento existente' })
  @ApiResponse({ status: 200, description: 'Orçamento atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async atualizarOrcamento(
    @Param('id') id: string,
    @Body(BODY_PIPE_EXPANSIVO) dados: AtualizarOrcamentoBodyDto,
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.atualizarOrcamento(
      id,
      dados,
      lojaId,
      usuarioId,
    );
  }

  /**
   * Remove orçamento
   */
  @Delete(':id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EXCLUIR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover orçamento' })
  @ApiResponse({ status: 204, description: 'Orçamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async removerOrcamento(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { motivo?: string },
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    await this.orcamentosService.removerOrcamento(
      id,
      lojaId,
      usuarioId,
      body.motivo,
    );
  }

  /**
   * Altera status do orçamento
   */
  @Put(':id/status')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({ summary: 'Alterar status do orçamento' })
  @ApiResponse({ status: 200, description: 'Status alterado com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async alterarStatus(
    @Param('id') id: string,
    @Body() dados: { status: string; observacoes?: string },
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.alterarStatus(
      id,
      dados.status as any,
      lojaId,
      usuarioId,
      dados.observacoes,
      extrairContextoDaRequisicao(req),
    );
  }

  /**
   * Calcula orçamento via motor V2
   */
  @Post(':id/calcular')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_EDITAR)
  @ApiOperation({ summary: 'Calcular orçamento via motor V2' })
  @ApiResponse({ status: 200, description: 'Cálculo realizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async calcularOrcamento(@Param('id') id: string, @Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    const orcamento = await this.orcamentosService.buscarOrcamento(id, lojaId);

    return await this.integracaoMotor.calcularOrcamentoCompleto(
      orcamento,
      lojaId,
      usuarioId,
    );
  }

  /**
   * Valida estoque do orçamento (apenas alertas)
   */
  @Get(':id/validar-estoque')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Validar estoque do orçamento (apenas alertas)' })
  @ApiResponse({ status: 200, description: 'Validação realizada' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async validarEstoque(@Param('id') id: string, @Request() req: any) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    const orcamento = await this.orcamentosService.buscarOrcamento(id, lojaId);

    return await this.validacaoEstoque.validarEstoqueOrcamento(
      orcamento,
      lojaId,
    );
  }

  /**
   * Busca insumos para auto-complete
   */
  @Get('insumos/autocomplete')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Buscar insumos para auto-complete' })
  @ApiResponse({ status: 200, description: 'Lista de insumos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarInsumosAutocomplete(
    @Query('busca') busca: string,
    @Request() req: any,
    @Query('categoria_id') categoriaId?: string,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.insumosAutocomplete.buscarInsumos(
      busca,
      categoriaId,
      lojaId,
    );
  }

  /**
   * Obtém estatísticas do motor V2
   */
  @Get('motor/estatisticas')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Obter estatísticas do motor V2' })
  @ApiResponse({ status: 200, description: 'Estatísticas do motor' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async obterEstatisticasMotor(@Request() req: any) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return await this.integracaoMotor.obterEstatisticasMotor(lojaId);
  }

  /**
   * Enviar orçamento para cliente
   */
  @Post(':id/enviar')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_ENVIAR)
  @ApiOperation({ summary: 'Enviar orçamento para cliente' })
  @ApiResponse({ status: 200, description: 'Orçamento enviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async enviarOrcamento(@Param('id') id: string, @Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.enviarOrcamento(id, lojaId, usuarioId);
  }

  /**
   * Duplica orçamento existente
   */
  /**
   * Fecha o pedido internamente e gera OS sem aprovação externa do cliente
   */
  @Post(':id/fechar-pedido')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR)
  @ApiOperation({ summary: 'Fechar pedido internamente e gerar OS' })
  @ApiResponse({ status: 200, description: 'Pedido fechado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async fecharPedido(
    @Param('id') id: string,
    @Body() body: { observacoes?: string },
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.fecharPedidoInterno(
      id,
      lojaId,
      usuarioId,
      body?.observacoes,
      extrairContextoDaRequisicao(req),
    );
  }

  @Post(':id/duplicar')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_CRIAR)
  @ApiOperation({ summary: 'Duplicar orçamento existente' })
  @ApiResponse({ status: 201, description: 'Orçamento duplicado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async duplicarOrcamento(
    @Param('id') id: string,
    @Body() dados: { titulo?: string; descricao?: string },
    @Request() req: any,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.orcamentosService.duplicarOrcamento(
      id,
      lojaId,
      usuarioId,
      dados,
    );
  }

  /**
   * Exporta orçamento em diferentes formatos.
   *
   * Gate 0S: nunca exportou nada — devolvia `200` com a frase "será
   * implementada" e lançava `Error` cru (`500`) para formato desconhecido. A
   * exportação real existe em `orcamentos-v2/impressao`. Fica fechado para não
   * manter uma superfície autenticada que só produz resposta enganosa.
   */
  @Get(':id/exportar/:formato')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({
    summary: 'Não implementado. Use os endpoints de impressão.',
  })
  @ApiResponse({ status: 501, description: 'Exportação não disponível' })
  exportarOrcamento(): never {
    throw new NotImplementedException(
      'Exportação não disponível. Use os endpoints de impressão da proposta.',
    );
  }
}
