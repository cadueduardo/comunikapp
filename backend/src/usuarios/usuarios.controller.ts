import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModuleActivationGuard } from '../common/guards/module-activation.guard';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Public } from '../auth/decorators';
import { TwoFactorService } from '../auth/two-factor.service';
import { ConfirmTwoFactorDto, DisableTwoFactorDto } from './dto/two-factor.dto';
import {
  AtualizarUsuarioPreferenciasDto,
  UsuarioPreferenciasJson,
} from './dto/usuario-preferencias.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  private getUserFromRequest(req: any): {
    id: string;
    loja_id: string;
    funcao?: string;
  } {
    const user = req?.user;
    if (!user?.id || !user?.loja_id) {
      throw new UnauthorizedException('Loja ID não encontrado no token');
    }
    return user;
  }

  private ensureAdmin(req: any) {
    const user = this.getUserFromRequest(req);
    if (user.funcao !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Somente administradores podem gerenciar usuários',
      );
    }
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard, ModuleActivationGuard)
  async listar(@Request() req: any) {
    const user = this.getUserFromRequest(req);
    return this.usuariosService.listar(user.loja_id);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  async twoFactorStatus(@Request() req: any) {
    const user = this.getUserFromRequest(req);
    return this.twoFactorService.getStatus(user.id);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setupTwoFactor(@Request() req: any) {
    const user = this.getUserFromRequest(req);
    return this.twoFactorService.createSetup(user.id);
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmTwoFactor(
    @Body() dto: ConfirmTwoFactorDto,
    @Request() req: any,
  ) {
    const user = this.getUserFromRequest(req);
    return this.twoFactorService.confirmSetup(user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disableTwoFactor(
    @Body() dto: DisableTwoFactorDto,
    @Request() req: any,
  ) {
    const user = this.getUserFromRequest(req);
    return this.twoFactorService.disable(user.id, dto.password, dto.code);
  }

  @Get('me/preferencias')
  @UseGuards(JwtAuthGuard)
  async obterMinhasPreferencias(@Request() req: any) {
    const user = this.getUserFromRequest(req);
    return this.usuariosService.obterPreferencias(user.id, user.loja_id);
  }

  @Patch('me/preferencias')
  @UseGuards(JwtAuthGuard)
  async atualizarMinhasPreferencias(
    @Body() dto: AtualizarUsuarioPreferenciasDto,
    @Request() req: any,
  ) {
    const user = this.getUserFromRequest(req);
    return this.usuariosService.atualizarPreferencias(
      user.id,
      user.loja_id,
      dto,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard)
  async obter(@Param('id') id: string, @Request() req: any) {
    const user = this.getUserFromRequest(req);
    return this.usuariosService.obter(id, user.loja_id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ModuleActivationGuard)
  async criar(@Body() dto: CreateUsuarioDto, @Request() req: any) {
    const user = this.ensureAdmin(req);
    return this.usuariosService.criar(user.loja_id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard)
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Request() req: any,
  ) {
    const user = this.ensureAdmin(req);
    return this.usuariosService.atualizar(id, user.loja_id, dto);
  }

  @Patch(':id/desativar')
  @UseGuards(JwtAuthGuard, ModuleActivationGuard)
  async desativar(@Param('id') id: string, @Request() req: any) {
    const user = this.ensureAdmin(req);
    if (id === user.id) {
      throw new BadRequestException(
        'Nao e permitido desativar o proprio usuario',
      );
    }
    return this.usuariosService.desativar(id, user.loja_id);
  }

  // Fluxo de convite/primeiro acesso (entradas public serão adicionadas na fase 2 com validação dedicada)
  @Post('reenviar-codigo')
  @Public()
  async reenviarCodigo(@Body('email') email: string) {
    return this.usuariosService.reenviarCodigo(email);
  }

  @Post('definir-senha')
  @Public()
  async definirSenha(
    @Body() body: { email: string; codigo: string; senha: string },
  ) {
    return this.usuariosService.definirSenhaInicial(
      body.email,
      body.codigo,
      body.senha,
    );
  }

  @Post('solicitar-redefinicao-senha')
  @Public()
  async solicitarRedefinicaoSenha(@Body() body: { email: string }) {
    return this.usuariosService.solicitarRedefinicaoSenha(body.email);
  }

  @Post('redefinir-senha')
  @Public()
  async redefinirSenha(@Body() body: { token: string; senha: string }) {
    return this.usuariosService.redefinirSenha(body.token, body.senha);
  }
}
