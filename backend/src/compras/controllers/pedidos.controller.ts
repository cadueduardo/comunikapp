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
import { PedidosWorkflowService } from '../services/pedidos-workflow.service';
import { PedidosSubstituicaoService } from '../services/pedidos-substituicao.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';
import { RejeitarPedidoDto } from '../dto/rejeitar-pedido.dto';
import { CancelarPedidoDto } from '../dto/cancelar-pedido.dto';
import { SubstituirFornecedorDto } from '../dto/substituir-fornecedor.dto';

@Controller('compras/pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly workflowService: PedidosWorkflowService,
    private readonly substituicaoService: PedidosSubstituicaoService,
  ) {}

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

  @Get(':id/visualizacao')
  visualizacao(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.pedidosService.visualizacao(id, lojaAtual);
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

  @Post(':id/enviar-aprovacao')
  enviarAprovacao(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.workflowService.enviarAprovacao(id, lojaAtual, usuario.id);
  }

  @Post(':id/aprovar')
  aprovar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.workflowService.aprovar(id, lojaAtual, usuario.id);
  }

  @Post(':id/rejeitar')
  rejeitar(
    @Param('id') id: string,
    @Body() dto: RejeitarPedidoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.workflowService.rejeitar(
      id,
      lojaAtual,
      usuario.id,
      dto.motivo,
    );
  }

  @Post(':id/enviar')
  enviar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.workflowService.enviarFornecedor(id, lojaAtual, usuario.id);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarPedidoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.workflowService.cancelar(
      id,
      lojaAtual,
      usuario.id,
      dto.motivo,
    );
  }

  @Post(':id/substituir-fornecedor')
  substituirFornecedor(
    @Param('id') id: string,
    @Body() dto: SubstituirFornecedorDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.substituicaoService.substituirFornecedor(
      id,
      dto,
      lojaAtual,
      usuario.id,
    );
  }
}
