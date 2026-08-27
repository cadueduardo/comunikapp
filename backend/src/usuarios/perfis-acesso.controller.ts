import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PerfisAcessoService } from './perfis-acesso.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../auth/decorators';
import { RequerPermissao } from '../rbac/autorizacao/requer-permissao.decorator';
import { PermissionsGuard } from '../rbac/autorizacao/permissions.guard';
import { CatalogoService } from '../rbac/catalogo/catalogo.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePerfilAcessoDto,
  UpdatePerfilAcessoDto,
} from './dto/perfil-acesso.dto';
import { ListarPerfisQueryDto } from './dto/paginacao-query.dto';

@ApiTags('Usuários — Perfis')
@ApiBearerAuth()
@Controller('usuarios/perfis')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequerPermissao('usuarios.perfis.gerenciar')
export class PerfisAcessoController {
  constructor(
    private readonly perfisService: PerfisAcessoService,
    private readonly catalogo: CatalogoService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('catalogo')
  async obterCatalogo(
    @Request() req: unknown,
    @Query('perfilId') perfilId?: string,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    const decisoes = perfilId
      ? await this.carregarDecisoes(lojaId, perfilId)
      : undefined;
    return this.catalogo.obterCatalogo(decisoes);
  }

  @Post()
  async criar(@Body() dto: CreatePerfilAcessoDto, @Request() req: unknown) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.criar(lojaId, dto, usuarioId);
  }

  @Get()
  async listar(
    @Request() req: unknown,
    @Query() query: ListarPerfisQueryDto,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.listar(lojaId, query);
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Request() req: unknown) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.obter(id, lojaId);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdatePerfilAcessoDto,
    @Request() req: unknown,
  ) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.atualizar(id, lojaId, dto, usuarioId);
  }

  @Delete(':id')
  async excluir(@Param('id') id: string, @Request() req: unknown) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.excluir(id, lojaId, usuarioId);
  }

  @Post(':id/usuarios/:usuarioId')
  async associarUsuario(
    @Param('id') perfilId: string,
    @Param('usuarioId') usuarioAlvoId: string,
    @Request() req: unknown,
  ) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.associarUsuario(
      perfilId,
      usuarioAlvoId,
      lojaId,
      usuarioId,
    );
  }

  @Delete(':id/usuarios/:usuarioId')
  async desassociarUsuario(
    @Param('id') perfilId: string,
    @Param('usuarioId') usuarioAlvoId: string,
    @Request() req: unknown,
  ) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.perfisService.desassociarUsuario(
      perfilId,
      usuarioAlvoId,
      lojaId,
      usuarioId,
    );
  }

  private async carregarDecisoes(lojaId: string, perfilId: string) {
    const perfil = await this.prisma.perfil_acesso.findFirst({
      where: { id: perfilId, loja_id: lojaId },
      include: { permissoes: true },
    });
    const mapa = new Map<string, boolean>();
    if (!perfil) {
      return mapa;
    }
    for (const linha of perfil.permissoes) {
      mapa.set(`${linha.modulo}.${linha.acao}`, linha.permitido);
    }
    return mapa;
  }
}
