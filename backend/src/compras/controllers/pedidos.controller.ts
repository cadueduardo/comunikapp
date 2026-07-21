import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { PedidosService } from '../services/pedidos.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';

@Controller('compras/pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(
    @Body() dto: CreatePedidoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.pedidosService.create(dto, lojaAtual, usuario.id);
  }

  @Get()
  findAll(@GetLoja() lojaAtual: loja) {
    return this.pedidosService.findAll(lojaAtual);
  }

  @Get(':id/historico')
  historico(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.pedidosService.historico(id, lojaAtual);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.pedidosService.findOne(id, lojaAtual);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePedidoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.pedidosService.update(id, dto, lojaAtual, usuario.id);
  }

  @Post(':id/aprovar')
  aprovar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.pedidosService.aprovar(id, lojaAtual, usuario.id);
  }
}
