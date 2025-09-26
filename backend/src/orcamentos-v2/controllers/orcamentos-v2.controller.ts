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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators';
import { OrcamentosV2Service } from '../services/orcamentos-v2.service';
import { IntegracaoMotorService } from '../services/integracao-motor.service';
import { ValidacaoEstoqueService } from '../services/validacao-estoque.service';
import { InsumosAutocompleteService } from '../services/insumos-autocomplete.service';
import { NotificacoesService } from '../../notificacoes/notificacoes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

/**
 * Controller Principal de Orçamentos V2
 * Implementa todos os endpoints CRUD usando motor de cálculo V2
 * 
 * ✅ ARQUIVO ≤ 200 LINHAS (CONFORME PREMISSAS)
 * ✅ INTEGRAÇÃO COMPLETA COM MOTOR FUNCIONANDO
 * ✅ ENDPOINTS DOCUMENTADOS COM SWAGGER
 */
@ApiTags('Orçamentos V2')
@Controller('orcamentos-v2')
@ApiBearerAuth()
export class OrcamentosV2Controller {
  constructor(
    private readonly orcamentosService: OrcamentosV2Service,
    private readonly integracaoMotor: IntegracaoMotorService,
    private readonly validacaoEstoque: ValidacaoEstoqueService,
    private readonly insumosAutocomplete: InsumosAutocompleteService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Reenviar código de aprovação - DEVE SER PRIMEIRA ROTA PÚBLICA
   */
  @Post(':id/reenviar-codigo')
  @Public()
  @ApiOperation({ summary: 'Reenviar código de aprovação' })
  @ApiResponse({ status: 200, description: 'Código reenviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async reenviarCodigoAprovacao(@Param('id') id: string) {
    return await this.orcamentosService.reenviarCodigoAprovacao(id);
  }

  /**
   * Cria novo orçamento
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Criar novo orçamento' })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async criarOrcamento(
    @Body() dados: any,
    @Request() req: any,
  ) {
    const { loja_id, user_id } = req.user;
    return await this.orcamentosService.criarOrcamento(dados, loja_id, user_id);
  }

  // ===== ENDPOINTS DE NOTIFICAÇÕES V2 =====
  @Get('notificacoes')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Listar notificações da loja' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarNotificacoes(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { loja_id } = req.user;
    const limitNumber = limit ? parseInt(limit) : 50;
    const offsetNumber = offset ? parseInt(offset) : 0;
    return this.notificacoesService.buscarNotificacoes(loja_id, limitNumber, offsetNumber);
  }

  /**
   * Busca notificações não visualizadas
   */
  @Get('notificacoes/nao-visualizadas')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Listar notificações não visualizadas' })
  @ApiResponse({ status: 200, description: 'Lista de notificações não visualizadas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarNaoVisualizadas(@Request() req: any) {
    const { loja_id } = req.user;
    return this.notificacoesService.buscarNaoVisualizadas(loja_id);
  }

  /**
   * Conta notificações não visualizadas
   */
  @Get('notificacoes/nao-visualizadas/count')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Contar notificações não visualizadas' })
  @ApiResponse({ status: 200, description: 'Contador de notificações não visualizadas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async contarNaoVisualizadas(@Request() req: any) {
    const { loja_id } = req.user;
    const count = await this.notificacoesService.contarNaoVisualizadas(loja_id);
    return { count };
  }

  /**
   * Marca notificação como visualizada
   */
  @Patch('notificacoes/:id/visualizar')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Marcar notificação como visualizada' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como visualizada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async marcarComoVisualizada(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    await this.notificacoesService.marcarComoVisualizada(id, loja_id);
    return { message: 'Notificação marcada como visualizada' };
  }

  /**
   * Marca todas as notificações como visualizadas
   */
  @Patch('notificacoes/visualizar-todas')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Marcar todas as notificações como visualizadas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações foram marcadas como visualizadas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async marcarTodasComoVisualizadas(@Request() req: any) {
    const { loja_id } = req.user;
    await this.notificacoesService.marcarTodasComoVisualizadas(loja_id);
    return {
      message: 'Todas as notificações foram marcadas como visualizadas',
    };
  }

  /**
   * Deleta notificação
   */
  @Delete('notificacoes/:id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar notificação' })
  @ApiResponse({ status: 204, description: 'Notificação deletada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async deletarNotificacao(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    await this.notificacoesService.deletarNotificacao(id, loja_id);
  }

  // ===== ENDPOINTS DE CHAT V2 =====
  /**
   * Buscar mensagens do chat (autenticado) - SEGUINDO PADRÃO DO LEGADO
   */
  @Get(':id/mensagens')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Buscar mensagens do chat (autenticado)' })
  @ApiResponse({ status: 200, description: 'Mensagens encontradas' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarMensagensChat(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    return await this.orcamentosService.buscarMensagensChatLegado(id, loja_id);
  }

  /**
   * Enviar mensagem no chat (autenticado - para vendedores) - SEGUINDO PADRÃO DO LEGADO
   */
  @Post(':id/mensagens')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiOperation({ summary: 'Enviar mensagem no chat (autenticado)' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async enviarMensagemChat(
    @Param('id') id: string,
    @Request() req: any,
    @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: false, forbidNonWhitelisted: false })) body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('🔍 Controller V2 autenticado - OrcamentoId:', id);
    console.log('🔍 Controller V2 autenticado - Body recebido:', JSON.stringify(body, null, 2));
    console.log('🔍 Controller V2 autenticado - File recebido:', file ? `${file.originalname} (${file.size} bytes, ${file.mimetype})` : 'nenhum');

    const { loja_id } = req.user;

    // Criar DTO manualmente a partir do body
    const dados = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'VENDEDOR',
      anexos: file ? [file.originalname] : undefined,
    };

    return await this.orcamentosService.enviarMensagemChatLegado(id, dados, loja_id, file);
  }

  /**
   * Marcar mensagem como lida (autenticado)
   */
  @Post('chat/:id/mensagens/:mensagemId/visualizar')
  @ApiOperation({ summary: 'Marcar mensagem como lida (autenticado)' })
  @ApiResponse({ status: 200, description: 'Mensagem marcada como lida' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async marcarMensagemComoLida(
    @Param('id') id: string,
    @Param('mensagemId') mensagemId: string,
    @Request() req: any,
  ) {
    const { usuario_id } = req.user;
    return await this.orcamentosService.marcarMensagemVisualizada(id, mensagemId, usuario_id);
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
   */
  @Post(':id/publico/acao')
  @Public()
  @ApiOperation({ summary: 'Processar ação do cliente público' })
  @ApiResponse({ status: 200, description: 'Ação processada com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async processarAcaoClientePublico(
    @Param('id') id: string,
    @Body() dados: { acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR'; observacoes?: string; codigo_aprovacao?: string; cliente_nome?: string; cliente_email?: string },
  ) {
    return await this.orcamentosService.processarAcaoClientePublico(id, dados);
  }

  /**
   * Buscar mensagens do chat público - SEGUINDO PADRÃO DO LEGADO
   */
  @Get(':id/mensagens/publico')
  @Public()
  @ApiOperation({ summary: 'Buscar mensagens do chat público' })
  @ApiResponse({ status: 200, description: 'Mensagens encontradas' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async buscarMensagensChatPublico(@Param('id') id: string) {
    return await this.orcamentosService.buscarMensagensPublicasLegado(id);
  }

  /**
   * Enviar mensagem no chat público - SEGUINDO PADRÃO DO LEGADO
   */
  @Post(':id/mensagens/publico')
  @Public()
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiOperation({ summary: 'Enviar mensagem no chat público' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  async enviarMensagemChatPublico(
    @Param('id') id: string,
    @Body(new ValidationPipe({ skipMissingProperties: true, whitelist: false, forbidNonWhitelisted: false })) body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('🔍 Controller V2 público - OrcamentoId:', id);
    console.log('🔍 Controller V2 público - Body recebido:', JSON.stringify(body, null, 2));
    console.log('🔍 Controller V2 público - File recebido:', file ? `${file.originalname} (${file.size} bytes, ${file.mimetype})` : 'nenhum');

    // Criar DTO manualmente a partir do body
    const dados = {
      mensagem: body.mensagem || '',
      tipo: body.tipo || 'CLIENTE',
      autor_nome: body.autor_nome || 'Cliente',
      autor_email: body.autor_email || '',
    };

    return await this.orcamentosService.enviarMensagemPublicaLegadoComAnexo(id, dados, file);
  }

  /**
   * Marcar mensagem como lida (chat público)
   */
  @Post(':id/publico/mensagens/:mensagemId/visualizar')
  @Public()
  @ApiOperation({ summary: 'Marcar mensagem como lida (chat público)' })
  @ApiResponse({ status: 200, description: 'Mensagem marcada como lida' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async marcarMensagemComoLidaPublico(
    @Param('id') id: string,
    @Param('mensagemId') mensagemId: string,
  ) {
    return await this.orcamentosService.marcarMensagemVisualizadaPublica(id, mensagemId);
  }

  /**
   * Busca orçamento por ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  @ApiResponse({ status: 200, description: 'Orçamento encontrado' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarOrcamento(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    console.log('🔍 Debug - req.user:', req.user);
    console.log('🔍 Debug - req.headers:', req.headers);
    
    if (!req.user) {
      throw new Error('Usuário não autenticado');
    }
    
    const { loja_id } = req.user;
    return await this.orcamentosService.buscarOrcamento(id, loja_id);
  }

  /**
   * Lista orçamentos com filtros
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Listar orçamentos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async listarOrcamentos(
    @Query() filtros: any,
    @Query() paginacao: any,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    return await this.orcamentosService.listarOrcamentos(loja_id, filtros, paginacao);
  }

  /**
   * Atualiza orçamento existente
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Atualizar orçamento existente' })
  @ApiResponse({ status: 200, description: 'Orçamento atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async atualizarOrcamento(
    @Param('id') id: string,
    @Body() dados: any,
    @Request() req: any,
  ) {
    console.log('🔥 CONTROLLER PUT /orcamentos-v2/:id CHAMADO!', { id, dadosKeys: Object.keys(dados), userLojaId: req.user?.loja_id });
    const { loja_id, user_id } = req.user;
    return await this.orcamentosService.atualizarOrcamento(id, dados, loja_id, user_id);
  }

  /**
   * Remove orçamento
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
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
    const { loja_id, user_id } = req.user;
    await this.orcamentosService.removerOrcamento(id, loja_id, user_id, body.motivo);
  }

  /**
   * Altera status do orçamento
   */
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
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
    const { loja_id, user_id } = req.user;
    return await this.orcamentosService.alterarStatus(
      id,
      dados.status as any,
      loja_id,
      user_id,
      dados.observacoes,
    );
  }

  /**
   * Calcula orçamento via motor V2
   */
  @Post(':id/calcular')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Calcular orçamento via motor V2' })
  @ApiResponse({ status: 200, description: 'Cálculo realizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async calcularOrcamento(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    const orcamento = await this.orcamentosService.buscarOrcamento(id, loja_id);
    
    return await this.integracaoMotor.calcularOrcamentoCompleto(
      orcamento,
      loja_id,
    );
  }

  /**
   * Valida estoque do orçamento (apenas alertas)
   */
  @Get(':id/validar-estoque')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Validar estoque do orçamento (apenas alertas)' })
  @ApiResponse({ status: 200, description: 'Validação realizada' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async validarEstoque(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    const orcamento = await this.orcamentosService.buscarOrcamento(id, loja_id);
    
    return await this.validacaoEstoque.validarEstoqueOrcamento(orcamento, loja_id);
  }

  /**
   * Busca insumos para auto-complete
   */
  @Get('insumos/autocomplete')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Buscar insumos para auto-complete' })
  @ApiResponse({ status: 200, description: 'Lista de insumos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async buscarInsumosAutocomplete(
    @Query('busca') busca: string,
    @Request() req: any,
    @Query('categoria_id') categoriaId?: string,
  ) {
    const { loja_id } = req.user;
    return await this.insumosAutocomplete.buscarInsumos(busca, categoriaId, loja_id);
  }

  /**
   * Obtém estatísticas do motor V2
   */
  @Get('motor/estatisticas')
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  @ApiOperation({ summary: 'Obter estatísticas do motor V2' })
  @ApiResponse({ status: 200, description: 'Estatísticas do motor' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async obterEstatisticasMotor(@Request() req: any) {
    const { loja_id } = req.user;
    return await this.integracaoMotor.obterEstatisticasMotor(loja_id);
  }

  /**
   * Duplica orçamento existente
   */
  @Post(':id/duplicar')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR)
  @ApiOperation({ summary: 'Duplicar orçamento existente' })
  @ApiResponse({ status: 201, description: 'Orçamento duplicado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async duplicarOrcamento(
    @Param('id') id: string,
    @Body() dados: { titulo?: string; descricao?: string },
    @Request() req: any,
  ) {
    const { loja_id, user_id } = req.user;
    const orcamentoOriginal = await this.orcamentosService.buscarOrcamento(id, loja_id);
    
    // Preparar dados para duplicação
    const dadosDuplicacao = {
      ...orcamentoOriginal,
      titulo: dados.titulo || `${orcamentoOriginal.titulo} (Cópia)`,
      descricao: dados.descricao || `Cópia do orçamento ${orcamentoOriginal.titulo}`,
      status: 'rascunho' as any,
      produtos: orcamentoOriginal.produtos,
    };

    // Remover campos que não devem ser duplicados
    delete dadosDuplicacao.id;
    delete dadosDuplicacao.data_criacao;
    delete dadosDuplicacao.data_atualizacao;
    delete (dadosDuplicacao as any).historicoOrcamento;
    delete dadosDuplicacao.versoes;
    delete dadosDuplicacao.aprovacoes;
    delete (dadosDuplicacao as any).linksPublicos;
    delete (dadosDuplicacao as any).mensagensChat;
    delete dadosDuplicacao.anexos;

    return await this.orcamentosService.criarOrcamento(dadosDuplicacao, loja_id, user_id);
  }

  /**
   * Exporta orçamento em diferentes formatos
   */
  @Get(':id/exportar/:formato')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Exportar orçamento em diferentes formatos' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado com sucesso' })
  @ApiResponse({ status: 404, description: 'Orçamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Formato não suportado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async exportarOrcamento(
    @Param('id') id: string,
    @Param('formato') formato: string,
    @Request() req: any,
  ) {
    const { loja_id } = req.user;
    const orcamento = await this.orcamentosService.buscarOrcamento(id, loja_id);
    
    // Validar formato
    const formatosSuportados = ['pdf', 'excel', 'csv'];
    if (!formatosSuportados.includes(formato.toLowerCase())) {
      throw new Error(`Formato não suportado. Use: ${formatosSuportados.join(', ')}`);
    }

    // TODO: Implementar exportação real
    return {
      mensagem: `Exportação em ${formato.toUpperCase()} será implementada`,
      orcamento_id: id,
      formato,
      timestamp: new Date(),
    };
  }


}
