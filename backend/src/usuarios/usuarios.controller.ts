import {
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

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  private getUserFromRequest(req: any): {
    loja_id: string;
    funcao?: string;
  } {
    const user = req?.user;
    if (!user?.loja_id) {
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
}
