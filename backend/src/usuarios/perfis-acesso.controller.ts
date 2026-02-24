import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  PerfisAcessoService,
  CreatePerfilAcessoDto,
  UpdatePerfilAcessoDto,
} from './perfis-acesso.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuarios/perfis')
@UseGuards(JwtAuthGuard)
export class PerfisAcessoController {
  constructor(private readonly perfisService: PerfisAcessoService) {}

  @Post()
  async criar(@Body() dto: CreatePerfilAcessoDto, @Request() req: any) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.criar(lojaId, dto);
  }

  @Get()
  async listar(@Request() req: any) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.listar(lojaId);
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Request() req: any) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.obter(id, lojaId);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdatePerfilAcessoDto,
    @Request() req: any,
  ) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  async excluir(@Param('id') id: string, @Request() req: any) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.excluir(id, lojaId);
  }

  @Post(':id/usuarios/:usuarioId')
  async associarUsuario(
    @Param('id') perfilId: string,
    @Param('usuarioId') usuarioId: string,
    @Request() req: any,
  ) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.associarUsuario(perfilId, usuarioId, lojaId);
  }

  @Delete(':id/usuarios/:usuarioId')
  async desassociarUsuario(
    @Param('id') perfilId: string,
    @Param('usuarioId') usuarioId: string,
    @Request() req: any,
  ) {
    const lojaId = req.user?.loja_id;
    if (!lojaId) {
      throw new Error('Loja ID não encontrado');
    }
    return this.perfisService.desassociarUsuario(perfilId, usuarioId, lojaId);
  }
}
