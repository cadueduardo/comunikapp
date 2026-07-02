import { Body, Controller, Get, BadRequestException, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { AtualizarEnderecoLoteDto,
  CriarLoteInstalacaoDto,
  RegistrarOcorrenciaGestaoDto,
} from '../dto/gestao.dto';
import { AtualizarStatusLoteDto } from '../dto/atualizar-status-lote.dto';
import { ConsultarAgendaQueryDto } from '../dto/consultar-agenda-query.dto';
import { ListarOsInstalacaoQueryDto } from '../dto/listar-os-instalacao-query.dto';
import { InstalacaoGestaoPermissionsGuard } from '../guards/instalacao-gestao-permissions.guard';
import { FinanceiroPermissionsGuard } from '../guards/financeiro-permissions.guard';
import { CepIntegrationService } from '../services/cep-integration.service';
import { InstalacaoPosCalculoService } from '../services/instalacao-pos-calculo.service';
import { InstalacaoService } from '../services/instalacao.service';
import { InstalacaoSplitFinanceiroService } from '../services/instalacao-split-financeiro.service';
import { ItemOSInstalacaoCriacaoService } from '../services/item-os-instalacao-criacao.service';
import { AbonarOcorrenciaDto } from '../dto/abonar-ocorrencia.dto';
import { FilaPrecificacaoQueryDto } from '../dto/fila-precificacao-query.dto';
import { GerarOsAditivaDto } from '../dto/gerar-os-aditiva.dto';
import { PrecificarOcorrenciaDto } from '../dto/precificar-ocorrencia.dto';
import { ConfiguracaoInstalacaoService } from '../services/configuracao-instalacao.service';
import { AtualizarOsAditivaConfigDto } from '../dto/atualizar-os-aditiva-config.dto';
@ApiTags('Instalações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instalacao')
export class InstalacaoController {
  constructor(
    private readonly cepService: CepIntegrationService,
    private readonly posCalculoService: InstalacaoPosCalculoService,
    private readonly instalacaoService: InstalacaoService,
    private readonly splitFinanceiroService: InstalacaoSplitFinanceiroService,
    private readonly itemOSInstalacaoCriacaoService: ItemOSInstalacaoCriacaoService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
  ) {}

  @Get('os')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Lista OS com instalação para o grid de gestão' })
  async listarOsInstalacao(
    @LojaId() lojaId: string,
    @Query() query: ListarOsInstalacaoQueryDto,
  ) {
    return this.instalacaoService.listarOsInstalacaoGestao(lojaId, query);
  }

  @Get('agenda')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({
    summary: 'Consulta agenda operacional de instalações no intervalo',
  })
  async consultarAgenda(
    @LojaId() lojaId: string,
    @Query() query: ConsultarAgendaQueryDto,
  ) {
    return this.instalacaoService.consultarAgenda(lojaId, query);
  }

  @Get('agenda/conflitos')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({
    summary:
      'Detecta conflitos de equipe com mais de um lote no mesmo dia (UX-04)',
  })
  async consultarConflitosAgenda(
    @LojaId() lojaId: string,
    @Query() query: ConsultarAgendaQueryDto,
  ) {
    return this.instalacaoService.consultarConflitosAgenda(lojaId, query);
  }

  @Get('lotes')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Lista todos os lotes de instalação da loja' })
  async listarLotes(@LojaId() lojaId: string) {
    return this.instalacaoService.listarLotesGestao(lojaId);
  }

  @Get('os/:osId/painel')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Painel gerencial da OS (lotes + ocorrências)' })
  async painelOs(@LojaId() lojaId: string, @Param('osId') osId: string) {
    return this.instalacaoService.obterPainelOs(lojaId, osId);
  }

  @Post('lotes')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Cria lote de instalação (rollout manual)' })
  async criarLote(
    @LojaId() lojaId: string,
    @Body() dto: CriarLoteInstalacaoDto,
  ) {
    const resultado = await this.itemOSInstalacaoCriacaoService.criarLoteManual({
      lojaId,
      itemOsId: dto.item_os_id,
      quantidadeAlocada: dto.quantidade_alocada,
      endereco: {
        cep: dto.cep,
        logradouro: dto.logradouro,
        numero: dto.numero,
        complemento: dto.complemento,
        bairro: dto.bairro,
        cidade: dto.cidade,
        uf: dto.uf,
      },
      dataPrevisao: dto.data_previsao ? new Date(dto.data_previsao) : undefined,
      turnoPrevisao: dto.turno_previsao,
      equipeInstalacao: dto.equipe_instalacao,
    });

    if (!resultado.criado) {
      const mensagens: Record<string, string> = {
        ITEM_NAO_ENCONTRADO: 'Item da OS não encontrado.',
        SEM_ORCAMENTO: 'OS sem orçamento vinculado.',
        SEM_INSTALACAO: 'Este item não exige instalação.',
        SEM_SALDO: 'Quantidade excede o saldo disponível para alocação.',
        AGUARDANDO_PRODUCAO:
          'A instalação só é liberada após a baixa de produção no PCP. Conclua a produção do item antes de criar lotes.',
      };
      const mensagem =
        mensagens[resultado.motivo_skip ?? ''] ??
        'Não foi possível criar o lote de instalação.';

      if (resultado.motivo_skip === 'ITEM_NAO_ENCONTRADO') {
        throw new NotFoundException(mensagem);
      }

      throw new BadRequestException(mensagem);
    }

    return resultado;
  }

  @Patch('lotes/:id/status')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Atualiza status operacional do lote (Kanban gestão)' })
  async atualizarStatusLote(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarStatusLoteDto,
  ) {
    return this.instalacaoService.atualizarStatusLoteGestao(
      lojaId,
      id,
      dto.status_instalacao,
    );
  }

  @Patch('lotes/:id')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Atualiza endereço e quantidade do lote' })
  async atualizarLote(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarEnderecoLoteDto,
  ) {
    return this.instalacaoService.atualizarEnderecoLote(lojaId, id, dto);
  }

  @Post('ocorrencias')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Registra ocorrência pelo broker (gestão)' })
  async registrarOcorrenciaGestao(
    @LojaId() lojaId: string,
    @Body() dto: RegistrarOcorrenciaGestaoDto,
  ) {
    return this.instalacaoService.registrarOcorrenciaObra({
      lojaId,
      osId: dto.os_id,
      itemInstalacaoId: dto.item_instalacao_id,
      tipo: dto.tipo,
      categoria: dto.categoria ?? undefined,
      quantidade: dto.quantidade,
      descricao: dto.descricao,
      fotosEvidencia: dto.fotos_evidencia,
    });
  }

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Consulta endereço por CEP (ViaCEP)' })
  async buscarCep(@Param('cep') cep: string) {
    return this.cepService.buscarEnderecoPorCep(cep);
  }

  @Get('os/:osId/margem-real')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Margem líquida real da OS (visão gerencial)' })
  async margemReal(@LojaId() lojaId: string, @Param('osId') osId: string) {
    return this.posCalculoService.calcularMargemRealOs(osId, lojaId);
  }

  @Get('os/:osId/split-fiscal')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Split fiscal NF-e vs NFS-e da OS' })
  async splitFiscal(@LojaId() lojaId: string, @Param('osId') osId: string) {
    return this.posCalculoService.obterSplitFiscalOs(osId, lojaId);
  }

  @Get('os/:osId/relatorio-tecnico')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Metadados do relatório técnico emitido' })
  async relatorioExistente(
    @LojaId() lojaId: string,
    @Param('osId') osId: string,
  ) {
    const relatorio = await this.posCalculoService.obterRelatorioExistente(
      osId,
      lojaId,
    );
    if (!relatorio) {
      throw new NotFoundException('Relatório técnico ainda não foi emitido para esta OS.');
    }
    return {
      id: relatorio.id,
      pdf_url: relatorio.pdf_url,
      pdf_token: relatorio.pdf_token,
      total_nfe: Number(relatorio.total_nfe),
      total_nfs: Number(relatorio.total_nfs),
      gerado_em: relatorio.gerado_em.toISOString(),
    };
  }

  @Post('os/:osId/aprovar-financeiro')
  @UseGuards(FinanceiroPermissionsGuard)
  @ApiOperation({
    summary:
      'Aprovação financeira pós-instalação (DEC-04): libera saldo A_FATURAR e finaliza expedição',
  })
  async aprovarFinanceiro(
    @LojaId() lojaId: string,
    @Param('osId') osId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.posCalculoService.aprovarFinanceiroOs(
      osId,
      lojaId,
      usuario.id,
    );
  }

  @Post('os/:osId/relatorio-tecnico')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({
    summary: 'Gera relatório técnico final e libera saldo / cobranças extras',
  })
  async gerarRelatorioTecnico(
    @LojaId() lojaId: string,
    @Param('osId') osId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.posCalculoService.gerarRelatorioTecnicoFinal(
      osId,
      lojaId,
      usuario.id,
    );
  }

  @Get('configuracao')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Configuração do módulo de instalação da loja' })
  async obterConfiguracao(@LojaId() lojaId: string) {
    const config = await this.configuracaoInstalacaoService.getOrCreate(lojaId);
    return {
      exigir_sinal_producao: config.exigir_sinal_producao,
      os_aditiva_habilitada: config.os_aditiva_habilitada,
    };
  }

  @Patch('configuracao/os-aditiva')
  @UseGuards(FinanceiroPermissionsGuard)
  @ApiOperation({
    summary: 'Habilita/desabilita Split Financeiro com OS Aditiva (INSTALACAO_OS_ADITIVA)',
  })
  async atualizarOsAditiva(
    @LojaId() lojaId: string,
    @Body() dto: AtualizarOsAditivaConfigDto,
  ) {
    const config =
      await this.configuracaoInstalacaoService.atualizarOsAditivaHabilitada(
        lojaId,
        dto.habilitada,
      );
    return { os_aditiva_habilitada: config.os_aditiva_habilitada };
  }

  @Get('ocorrencias/fila-precificacao')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Fila transversal de ocorrências para precificação' })
  async filaPrecificacao(
    @LojaId() lojaId: string,
    @Query() query: FilaPrecificacaoQueryDto,
  ) {
    return this.splitFinanceiroService.listarFilaPrecificacao(lojaId, query);
  }

  @Get('ocorrencias/contadores')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Contadores de ocorrências pendentes/precificadas' })
  async contadoresOcorrencias(@LojaId() lojaId: string) {
    return this.splitFinanceiroService.contadoresPendencias(lojaId);
  }

  @Patch('ocorrencias/:id/precificar')
  @UseGuards(FinanceiroPermissionsGuard)
  @ApiOperation({ summary: 'Precifica ocorrência de campo (gestor/financeiro)' })
  async precificarOcorrencia(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: PrecificarOcorrenciaDto,
  ) {
    return this.splitFinanceiroService.precificarOcorrencia(
      id,
      lojaId,
      usuario.id,
      dto,
    );
  }

  @Patch('ocorrencias/:id/abonar')
  @UseGuards(FinanceiroPermissionsGuard)
  @ApiOperation({ summary: 'Abona cobrança de ocorrência de campo' })
  async abonarOcorrencia(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AbonarOcorrenciaDto,
  ) {
    return this.splitFinanceiroService.abonarOcorrencia(
      id,
      lojaId,
      usuario.id,
      dto,
    );
  }

  @Post('os/:osPaiId/gerar-os-aditiva')
  @UseGuards(FinanceiroPermissionsGuard)
  @ApiOperation({
    summary: 'Gera OS Aditiva (OS-XXXX-A1) a partir de ocorrências precificadas',
  })
  async gerarOsAditiva(
    @LojaId() lojaId: string,
    @Param('osPaiId') osPaiId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: GerarOsAditivaDto,
  ) {
    return this.splitFinanceiroService.gerarOsAditiva(
      osPaiId,
      lojaId,
      usuario.id,
      dto.ocorrencia_ids,
    );
  }

  @Get('os/:osPaiId/os-aditivas')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Lista OS Aditivas vinculadas à OS principal' })
  async listarOsAditivas(
    @LojaId() lojaId: string,
    @Param('osPaiId') osPaiId: string,
  ) {
    return this.splitFinanceiroService.listarOsAditivasPorOsPai(
      osPaiId,
      lojaId,
    );
  }
}
