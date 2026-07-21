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
import { AceitesServicoService } from '../services/aceites-servico.service';
import {
  CancelarAceiteServicoDto,
  CreateAceiteServicoDto,
} from '../dto/create-aceite-servico.dto';

@Controller('compras/pedidos/:pedidoId/aceites-servico')
@UseGuards(JwtAuthGuard)
export class PedidoAceitesServicoController {
  constructor(private readonly aceitesService: AceitesServicoService) {}

  @Post()
  create(
    @Param('pedidoId') pedidoId: string,
    @Body() dto: CreateAceiteServicoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.aceitesService.create(pedidoId, dto, lojaAtual, usuario.id);
  }

  @Get()
  list(
    @Param('pedidoId') pedidoId: string,
    @GetLoja() lojaAtual: loja,
  ) {
    return this.aceitesService.listByPedido(pedidoId, lojaAtual);
  }
}

@Controller('compras/aceites-servico')
@UseGuards(JwtAuthGuard)
export class AceitesServicoController {
  constructor(private readonly aceitesService: AceitesServicoService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.aceitesService.findOne(id, lojaAtual);
  }

  @Post(':id/confirmar')
  confirmar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.aceitesService.confirmar(id, lojaAtual, usuario.id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarAceiteServicoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.aceitesService.cancelar(id, dto, lojaAtual, usuario.id);
  }
}
