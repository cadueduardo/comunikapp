import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { PCPDashboardService } from '../services/pcp-dashboard.service';

@ApiTags('PCP - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp')
export class PCPDashboardController {
  constructor(private readonly dashboardService: PCPDashboardService) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Retorna dados agregados do dashboard PCP adaptados ao nível da loja',
  })
  @ApiResponse({ status: 200, description: 'Dashboard PCP da loja.' })
  obter(@LojaId() lojaId: string) {
    return this.dashboardService.obter(lojaId);
  }
}
