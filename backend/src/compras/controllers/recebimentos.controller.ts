import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { RecebimentosService } from '../services/recebimentos.service';
import {
  CancelarRecebimentoDto,
  CreateRecebimentoDto,
} from '../dto/create-recebimento.dto';

@Controller('compras/pedidos/:pedidoId/recebimentos')
@UseGuards(JwtAuthGuard)
export class PedidoRecebimentosController {
  constructor(private readonly recebimentosService: RecebimentosService) {}

  @Post()
  create(
    @Param('pedidoId') pedidoId: string,
    @Body() dto: CreateRecebimentoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.recebimentosService.create(
      pedidoId,
      dto,
      lojaAtual,
      usuario.id,
    );
  }

  @Get()
  list(
    @Param('pedidoId') pedidoId: string,
    @GetLoja() lojaAtual: loja,
  ) {
    return this.recebimentosService.listByPedido(pedidoId, lojaAtual);
  }
}

@Controller('compras/recebimentos')
@UseGuards(JwtAuthGuard)
export class RecebimentosController {
  constructor(private readonly recebimentosService: RecebimentosService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.recebimentosService.findOne(id, lojaAtual);
  }

  @Post(':id/confirmar')
  confirmar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.recebimentosService.confirmar(id, lojaAtual, usuario.id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarRecebimentoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.recebimentosService.cancelar(
      id,
      dto,
      lojaAtual,
      usuario.id,
    );
  }
}
