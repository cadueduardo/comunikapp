import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import {
  AtualizarEnderecoLoteDto,
  RegistrarOcorrenciaGestaoDto,
} from '../dto/gestao.dto';
import { InstalacaoGestaoPermissionsGuard } from '../guards/instalacao-gestao-permissions.guard';
import { CepIntegrationService } from '../services/cep-integration.service';
import { InstalacaoPosCalculoService } from '../services/instalacao-pos-calculo.service';
import { InstalacaoService } from '../services/instalacao.service';
@ApiTags('Instalações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instalacao')
export class InstalacaoController {
  constructor(
    private readonly cepService: CepIntegrationService,
    private readonly posCalculoService: InstalacaoPosCalculoService,
    private readonly instalacaoService: InstalacaoService,
  ) {}

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
}
