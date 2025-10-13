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
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ArteVersaoService } from '../services/arte-versao.service';
import { CreateArteVersaoDto } from '../dto/create-arte-versao.dto';
import { UpdateArteVersaoDto } from '../dto/update-arte-versao.dto';
import { ArteVersaoResponseDto, ArteVersaoListResponseDto } from '../dto/arte-response.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@ApiTags('Arte & Aprovação - Versões')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/versoes')
export class ArteVersaoController {
  constructor(private readonly arteVersaoService: ArteVersaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova versão de arte' })
  @ApiResponse({
    status: 201,
    description: 'Versão criada com sucesso',
    type: ArteVersaoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiResponse({ status: 403, description: 'Versão já existe' })
  async create(
    @Body() createDto: CreateArteVersaoDto,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto> {
    console.log('🎨 [Controller] Criando versão:', {
      osId: createDto.os_id,
      versao: createDto.versao,
      usuarioId: req.user.id,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.createVersao(
      createDto,
      req.user.id,
      req.user.loja_id
    );
  }

  @Get('os/:osId')
  @ApiOperation({ summary: 'Listar versões de uma OS' })
  @ApiResponse({
    status: 200,
    description: 'Lista de versões',
    type: [ArteVersaoResponseDto]
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async findByOS(
    @Param('osId') osId: string,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto[]> {
    console.log('📋 [Controller] Listando versões da OS:', {
      osId,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.findVersoesByOS(osId, req.user.loja_id);
  }

  @Get('produto/:produtoId')
  @ApiOperation({ summary: 'Listar versões de um produto específico' })
  @ApiResponse({
    status: 200,
    description: 'Lista de versões do produto',
    type: [ArteVersaoResponseDto]
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async findByProduto(
    @Param('produtoId') produtoId: string,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto[]> {
    console.log('📋 [Controller] Listando versões do produto:', {
      produtoId,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.findVersoesByProduto(produtoId, req.user.loja_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar versão por ID' })
  @ApiResponse({
    status: 200,
    description: 'Versão encontrada',
    type: ArteVersaoResponseDto
  })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto> {
    console.log('🔍 [Controller] Buscando versão:', {
      id,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.findVersaoById(id, req.user.loja_id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar versão' })
  @ApiResponse({
    status: 200,
    description: 'Versão atualizada com sucesso',
    type: ArteVersaoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateArteVersaoDto,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto> {
    console.log('✏️ [Controller] PUT /arte-aprovacao/versoes/:id chamado:', {
      id,
      updateDto,
      lojaId: req.user?.loja_id,
      userId: req.user?.id,
      user: req.user,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    try {
      if (!req.user) {
        console.error('❌ [Controller] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const result = await this.arteVersaoService.updateVersao(id, updateDto, req.user.loja_id);
      console.log('✅ [Controller] Versão atualizada com sucesso:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [Controller] Erro ao atualizar versão:', error);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover versão (soft delete)' })
  @ApiResponse({ status: 204, description: 'Versão removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    console.log('🗑️ [Controller] Removendo versão:', {
      id,
      usuarioId: req.user.id,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.removeVersao(id, req.user.loja_id, req.user.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restaurar versão deletada' })
  @ApiResponse({
    status: 200,
    description: 'Versão restaurada com sucesso',
    type: ArteVersaoResponseDto
  })
  @ApiResponse({ status: 404, description: 'Versão não encontrada' })
  async restore(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ArteVersaoResponseDto> {
    console.log('♻️ [Controller] Restaurando versão:', {
      id,
      lojaId: req.user.loja_id
    });

    return this.arteVersaoService.restoreVersao(id, req.user.loja_id);
  }

  @Post(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar versão de arte (equipe interna)' })
  @ApiResponse({ status: 200, description: 'Versão aprovada com sucesso' })
  async aprovarVersao(
    @Param('id') id: string,
    @Request() req
  ): Promise<ArteVersaoResponseDto> {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;
    
    return this.arteVersaoService.updateVersao(id, {
      status: 'APROVADA' as any,
      aprovado_por_cliente: true,
    }, lojaId);
  }

  @Post(':id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar versão de arte (equipe interna)' })
  @ApiResponse({ status: 200, description: 'Versão rejeitada com sucesso' })
  async rejeitarVersao(
    @Param('id') id: string,
    @Request() req
  ): Promise<ArteVersaoResponseDto> {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;
    
    return this.arteVersaoService.updateVersao(id, {
      status: 'REVISAO_SOLICITADA' as any,
      aprovado_por_cliente: false,
    }, lojaId);
  }

  @Post('aprovar-multiplas')
  @ApiOperation({ summary: 'Aprovar múltiplas versões de arte' })
  @ApiResponse({ status: 200, description: 'Versões aprovadas com sucesso' })
  async aprovarMultiplasVersoes(
    @Body() dto: { versaoIds: string[] },
    @Request() req
  ): Promise<{ aprovadas: number; erros: string[] }> {
    const usuarioId = req.user.id;
    const lojaId = req.user.loja_id;
    const erros: string[] = [];
    let aprovadas = 0;

    for (const versaoId of dto.versaoIds) {
      try {
        await this.arteVersaoService.updateVersao(versaoId, {
          status: 'APROVADA' as any,
          aprovado_por_cliente: true,
        }, lojaId);
        aprovadas++;
      } catch (error) {
        erros.push(`Erro ao aprovar versão ${versaoId}: ${error.message}`);
      }
    }

    return { aprovadas, erros };
  }
}
