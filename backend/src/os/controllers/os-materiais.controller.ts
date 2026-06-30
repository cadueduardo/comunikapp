import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OSService } from '../services/os.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';
import { AnotarSobraDto, RegistrarSobraDto } from '../dto/os-materiais.dto';

@ApiTags('OS - Materiais')
@ApiBearerAuth()
@Controller('os')
@UseGuards(OSPermissionsGuard)
export class OSMateriaisController {
  constructor(private readonly osService: OSService) {}

  @Get(':id/materiais')
  @ApiOperation({ summary: 'Listar materiais previstos e sobras da OS' })
  async listarMateriais(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    return this.osService.listarMateriaisOS(id, user.loja_id);
  }

  @Post(':id/itens/:itemId/ignorar-sobra')
  @ApiOperation({ summary: 'Marcar sobra estimada como ignorada na OS' })
  async ignorarSobra(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    return this.osService.ignorarSobraOS(id, itemId, user.loja_id, user.id);
  }

  @Post(':id/itens/:itemId/anotar-sobra')
  @ApiOperation({
    summary: 'Anotar sobra estimada na OS sem movimentar estoque',
  })
  async anotarSobra(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: AnotarSobraDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    return this.osService.anotarSobraOS(id, itemId, user.loja_id, user.id, dto);
  }

  @Post(':id/itens/:itemId/registrar-sobra')
  @ApiOperation({ summary: 'Registrar sobra estimada como retalho' })
  async registrarSobra(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: RegistrarSobraDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    return this.osService.registrarSobraOS(
      id,
      itemId,
      user.loja_id,
      user.id,
      dto,
    );
  }
}
