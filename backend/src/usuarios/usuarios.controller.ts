import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModuleActivationGuard } from '../common/guards/module-activation.guard';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, ModuleActivationGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async listar() {
    return this.usuariosService.listar();
  }

  @Get(':id')
  async obter(@Param('id') id: string) {
    return this.usuariosService.obter(id);
  }

  @Post()
  async criar(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.criar(dto);
  }

  @Patch(':id')
  async atualizar(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.atualizar(id, dto);
  }
}


