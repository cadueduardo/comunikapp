import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { PerfisAcessoService } from './perfis-acesso.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModuleActivationGuard } from '../common/guards/module-activation.guard';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Public, extrairIdentidadeAutenticada } from '../auth/decorators';
import { TwoFactorService } from '../auth/two-factor.service';
import { ConfirmTwoFactorDto, DisableTwoFactorDto } from './dto/two-factor.dto';
import {
  AtualizarUsuarioPreferenciasDto,
} from './dto/usuario-preferencias.dto';
import {
  DefinirSenhaInicialDto,
  RedefinirSenhaDto,
  ReenviarCodigoDto,
  SolicitarRedefinicaoSenhaDto,
} from './dto/acesso-publico.dto';
import { PermissaoEfetivaService } from '../rbac/autorizacao/permissao-efetiva.service';
import { RequerPermissao } from '../rbac/autorizacao/requer-permissao.decorator';
import { PermissionsGuard } from '../rbac/autorizacao/permissions.guard';
import {
  ListarPerfisQueryDto,
  ListarUsuariosQueryDto,
} from './dto/paginacao-query.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly perfisAcessoService: PerfisAcessoService,
    private readonly twoFactorService: TwoFactorService,
    private readonly permissaoEfetiva: PermissaoEfetivaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async listar(
    @Request() req: unknown,
    @Query() query: ListarUsuariosQueryDto,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.listar(lojaId, query);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  async twoFactorStatus(@Request() req: unknown) {
    const { usuarioId } = extrairIdentidadeAutenticada(req);
    return this.twoFactorService.getStatus(usuarioId);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setupTwoFactor(@Request() req: unknown) {
    const { usuarioId } = extrairIdentidadeAutenticada(req);
    return this.twoFactorService.createSetup(usuarioId);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmTwoFactor(
    @Body() dto: ConfirmTwoFactorDto,
    @Request() req: unknown,
  ) {
    const { usuarioId } = extrairIdentidadeAutenticada(req);
    return this.twoFactorService.confirmSetup(usuarioId, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disableTwoFactor(
    @Body() dto: DisableTwoFactorDto,
    @Request() req: unknown,
  ) {
    const { usuarioId } = extrairIdentidadeAutenticada(req);
    return this.twoFactorService.disable(usuarioId, dto.password, dto.code);
  }

  @Get('me/preferencias')
  @UseGuards(JwtAuthGuard)
  async obterMinhasPreferencias(@Request() req: unknown) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.obterPreferencias(usuarioId, lojaId);
  }

  @Patch('me/preferencias')
  @UseGuards(JwtAuthGuard)
  async atualizarMinhasPreferencias(
    @Body() dto: AtualizarUsuarioPreferenciasDto,
    @Request() req: unknown,
  ) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.atualizarPreferencias(usuarioId, lojaId, dto);
  }

  @Get('me/acesso')
  @UseGuards(JwtAuthGuard)
  async obterMeuAcesso(@Request() req: unknown) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    const modulos = await this.permissaoEfetiva.listarAcessoModulos(
      usuarioId,
      lojaId,
    );
    return { modulos };
  }

  // Estático antes de `:id`. Sem isto, GET /usuarios/perfis vira
  // GET /usuarios/:id com id="perfis" e responde 404 de usuário.
  @Get('perfis')
  @ApiExcludeEndpoint()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequerPermissao('usuarios.perfis.gerenciar')
  async listarPerfis(
    @Request() req: unknown,
    @Query() query: ListarPerfisQueryDto,
  ) {
    const { lojaId } = extrairIdentidadeAutenticada(req);
    return this.perfisAcessoService.listar(lojaId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async obter(@Param('id') id: string, @Request() req: unknown) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.obter(id, lojaId, usuarioId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async criar(@Body() dto: CreateUsuarioDto, @Request() req: unknown) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.criar(lojaId, dto, usuarioId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Request() req: unknown,
  ) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.atualizar(id, lojaId, dto, usuarioId);
  }

  @Patch(':id/desativar')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async desativar(@Param('id') id: string, @Request() req: unknown) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    if (id === usuarioId) {
      throw new BadRequestException(
        'Não é permitido desativar o próprio usuário',
      );
    }
    return this.usuariosService.desativar(id, lojaId, usuarioId);
  }

  @Patch(':id/reativar')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard, PermissionsGuard)
  @RequerPermissao('usuarios.usuarios.gerenciar')
  async reativar(@Param('id') id: string, @Request() req: unknown) {
    const { lojaId, usuarioId } = extrairIdentidadeAutenticada(req);
    return this.usuariosService.reativar(id, lojaId, usuarioId);
  }

  @Post('reenviar-codigo')
  @Public()
  async reenviarCodigo(@Body() dto: ReenviarCodigoDto) {
    return this.usuariosService.reenviarCodigo(dto.email);
  }

  @Post('definir-senha')
  @Public()
  async definirSenha(@Body() dto: DefinirSenhaInicialDto) {
    return this.usuariosService.definirSenhaInicial(
      dto.email,
      dto.codigo,
      dto.senha,
    );
  }

  @Post('solicitar-redefinicao-senha')
  @Public()
  async solicitarRedefinicaoSenha(@Body() dto: SolicitarRedefinicaoSenhaDto) {
    return this.usuariosService.solicitarRedefinicaoSenha(dto.email);
  }

  @Post('redefinir-senha')
  @Public()
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.usuariosService.redefinirSenha(dto.token, dto.senha);
  }
}
