import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../../auth/decorators';
import { AuthenticatedUser } from '../../../auth/auth.service';
import { ContasPagarService } from '../services/contas-pagar.service';
import { PagamentosFornecedorService } from '../services/pagamentos-fornecedor.service';
import {
  CancelarContaPagarDto,
  CreateContaPagarDto,
} from '../dto/create-conta-pagar.dto';
import { CreatePagamentoDto } from '../dto/create-pagamento.dto';

@Controller('financeiro/contas-pagar')
@UseGuards(JwtAuthGuard)
export class ContasPagarController {
  constructor(
    private readonly contasPagarService: ContasPagarService,
    private readonly pagamentosService: PagamentosFornecedorService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateContaPagarDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.contasPagarService.create(dto, lojaAtual, usuario.id);
  }

  @Post('from-pedido/:pedidoId')
  createFromPedido(
    @Param('pedidoId') pedidoId: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.contasPagarService.createFromPedido(
      pedidoId,
      lojaAtual,
      usuario.id,
    );
  }

  @Get()
  list(
    @GetLoja() lojaAtual: loja,
    @Query('status') status?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('pedido_id') pedido_id?: string,
  ) {
    return this.contasPagarService.list(lojaAtual, {
      status,
      fornecedor_id,
      pedido_id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.contasPagarService.findOne(id, lojaAtual);
  }

  @Post(':id/pagamentos')
  registrarPagamento(
    @Param('id') id: string,
    @Body() dto: CreatePagamentoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.pagamentosService.registrar(id, dto, lojaAtual, usuario.id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarContaPagarDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.contasPagarService.cancelar(id, dto, lojaAtual, usuario.id);
  }
}
