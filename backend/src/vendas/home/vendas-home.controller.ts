import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { VendasHomeService } from './vendas-home.service';

@ApiTags('Vendas — Home')
@ApiBearerAuth()
@Controller('vendas/home')
@UseGuards(JwtAuthGuard)
export class VendasHomeController {
  constructor(private readonly home: VendasHomeService) {}

  @Get()
  @ApiOperation({ summary: 'Home acionável do vendedor' })
  obter(@Request() req: unknown) {
    return this.home.obter(extrairIdentidadeAutenticada(req));
  }
}
