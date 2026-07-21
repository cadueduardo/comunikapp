import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../../auth/decorators';
import { AuthenticatedUser } from '../../../auth/auth.service';
import { PagamentosFornecedorService } from '../services/pagamentos-fornecedor.service';
import { EstornarPagamentoDto } from '../dto/estornar-pagamento.dto';

@Controller('financeiro/pagamentos')
@UseGuards(JwtAuthGuard)
export class PagamentosFornecedorController {
  constructor(
    private readonly pagamentosService: PagamentosFornecedorService,
  ) {}

  @Post(':id/estornar')
  estornar(
    @Param('id') id: string,
    @Body() dto: EstornarPagamentoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.pagamentosService.estornar(id, dto, lojaAtual, usuario.id);
  }
}
