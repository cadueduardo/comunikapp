import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Identidade, IdentidadeAutenticada } from '../auth/decorators';
import { VendasPermissionsGuard } from '../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../vendas/permissions/vendas-permissoes';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ListarClientesQueryDto } from './dto/listar-clientes-query.dto';
import { TransferirCarteiraDto } from './dto/transferir-carteira.dto';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UpdateContatoDto } from './dto/update-contato.dto';

/** Qualquer um dos quatro escopos de carteira dá acesso à listagem/ficha. */
const PERMISSOES_VISUALIZACAO_CARTEIRA = [
  VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
  VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE,
  VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
  VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
] as const;

/**
 * `VendasPermissionsGuard` nega por padrão (Gate 0S/DV-13): todo endpoint
 * autenticado abaixo declara `@RequerPermissaoVendas`. A autorização REAL
 * (escopo de carteira por registro) é sempre revalidada no
 * `ClientesService`, nunca só aqui.
 */
@ApiTags('Vendas — Clientes e carteira')
@ApiBearerAuth()
@Controller('clientes')
@UseGuards(JwtAuthGuard, VendasPermissionsGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @RequerPermissaoVendas(...PERMISSOES_VISUALIZACAO_CARTEIRA)
  @ApiOperation({
    summary: 'Lista clientes da carteira, paginado por padrão',
    description:
      'Resposta padrão: { data, meta }. Com ?legado=1, retorna array puro (compatibilidade).',
  })
  listar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query() query: ListarClientesQueryDto,
  ) {
    return this.clientesService.listar(identidade, query);
  }

  @Get('search')
  @RequerPermissaoVendas(...PERMISSOES_VISUALIZACAO_CARTEIRA)
  @ApiOperation({
    summary: 'Busca rápida de clientes (array), usada por selects de orçamento',
  })
  buscar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('q') q?: string,
    @Query('escopo') escopo?: 'propria' | 'equipe' | 'todos' | 'sem_responsavel',
  ) {
    return this.clientesService.buscar(identidade, q, escopo);
  }

  @Post()
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CLIENTE_CRIAR)
  @ApiOperation({
    summary: 'Cria cliente/prospect; o criador vira responsável comercial',
  })
  criar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Body() dto: CreateClienteDto,
  ) {
    return this.clientesService.criar(identidade, dto);
  }

  @Get(':id')
  @RequerPermissaoVendas(...PERMISSOES_VISUALIZACAO_CARTEIRA)
  @ApiOperation({ summary: 'Ficha do cliente (404 se fora do escopo do chamador)' })
  obterUm(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
  ) {
    return this.clientesService.obterUm(identidade, id);
  }

  @Put(':id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CLIENTE_EDITAR)
  @ApiOperation({
    summary: 'Atualiza dados cadastrais (não transfere responsável comercial)',
  })
  atualizar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.atualizar(identidade, id, dto);
  }

  @Delete(':id')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CLIENTE_INATIVAR)
  @ApiOperation({ summary: 'Inativa o cliente (soft — nunca apaga histórico)' })
  inativar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
  ) {
    return this.clientesService.inativar(identidade, id);
  }

  @Post(':id/transferir')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR)
  @ApiOperation({
    summary: 'Transfere o responsável comercial da carteira (idempotente)',
  })
  transferir(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
    @Body() dto: TransferirCarteiraDto,
  ) {
    return this.clientesService.transferirCarteira(identidade, id, dto);
  }

  @Post(':id/mesclar')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CLIENTE_MESCLAR)
  @ApiOperation({ summary: 'Mesclagem administrativa (diferida — Fase 13)' })
  mesclar(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
  ) {
    return this.clientesService.mesclar(identidade, id);
  }

  @Get(':id/contatos')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CONTATO_GERENCIAR)
  @ApiOperation({ summary: 'Lista contatos ativos do cliente' })
  listarContatos(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
  ) {
    return this.clientesService.listarContatos(identidade, id);
  }

  @Post(':id/contatos')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CONTATO_GERENCIAR)
  @ApiOperation({ summary: 'Cria contato do cliente' })
  criarContato(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
    @Body() dto: CreateContatoDto,
  ) {
    return this.clientesService.criarContato(identidade, id, dto);
  }

  @Put(':id/contatos/:contatoId')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CONTATO_GERENCIAR)
  @ApiOperation({ summary: 'Atualiza contato do cliente' })
  atualizarContato(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
    @Param('contatoId') contatoId: string,
    @Body() dto: UpdateContatoDto,
  ) {
    return this.clientesService.atualizarContato(identidade, id, contatoId, dto);
  }

  @Delete(':id/contatos/:contatoId')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.CONTATO_GERENCIAR)
  @ApiOperation({ summary: 'Inativa contato do cliente (soft)' })
  inativarContato(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('id') id: string,
    @Param('contatoId') contatoId: string,
  ) {
    return this.clientesService.inativarContato(identidade, id, contatoId);
  }
}
