import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';
import { multerProdutoFinitoImagemConfig } from '../config/multer-produto-finito-imagem.config';
import { CreateCategoriaProdutoFinitoDto } from './dto/create-categoria-produto-finito.dto';
import { CreateProdutoFinitoDto } from './dto/create-produto-finito.dto';
import { ListProdutosFinitosQueryDto } from './dto/list-produtos-finitos-query.dto';
import { ReordenarImagensDto } from './dto/reordenar-imagens.dto';
import { UpdateProdutoFinitoDto } from './dto/update-produto-finito.dto';
import { ProdutoFinitoImagemService } from './produto-finito-imagem.service';
import { ProdutosFinitosService } from './produtos-finitos.service';

@ApiTags('Produtos (prateleira)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('produtos-finitos')
export class ProdutosFinitosController {
  constructor(
    private readonly produtosFinitosService: ProdutosFinitosService,
    private readonly imagemService: ProdutoFinitoImagemService,
  ) {}

  @Get('categorias')
  @ApiOperation({ summary: 'Lista categorias de produtos da loja' })
  listarCategorias(
    @CurrentLojaId() lojaId: string,
    @Query('ativo') ativo?: string,
  ) {
    const filtroAtivo =
      ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    return this.produtosFinitosService.listarCategorias(lojaId, filtroAtivo);
  }

  @Post('categorias')
  @ApiOperation({ summary: 'Cria categoria de produto (inline)' })
  criarCategoria(
    @Body() dto: CreateCategoriaProdutoFinitoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosFinitosService.criarCategoria(lojaId, dto);
  }

  @Get('imagens/:token')
  @ApiOperation({ summary: 'Serve imagem do produto (autenticado)' })
  async servirImagem(
    @Param('token') token: string,
    @CurrentLojaId() lojaId: string,
    @Res() res: Response,
  ) {
    await this.imagemService.servirImagem(token, lojaId, res);
  }

  @Get()
  @ApiOperation({ summary: 'Lista produtos de prateleira da loja' })
  listar(
    @CurrentLojaId() lojaId: string,
    @Query() query: ListProdutosFinitosQueryDto,
  ) {
    return this.produtosFinitosService.listar(lojaId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra produto de prateleira' })
  criar(
    @Body() dto: CreateProdutoFinitoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosFinitosService.criar(lojaId, dto);
  }

  @Get(':id/para-orcamento')
  @ApiOperation({
    summary:
      'Carrega produto com preço efetivo e metadados de personalização para orçamento',
  })
  obterParaOrcamento(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosFinitosService.obterParaOrcamento(id, lojaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém produto por ID' })
  obterPorId(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.produtosFinitosService.obterPorId(id, lojaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza produto de prateleira' })
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoFinitoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.produtosFinitosService.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa produto (soft delete)' })
  remover(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.produtosFinitosService.remover(id, lojaId);
  }

  @Post(':id/imagens')
  @UseInterceptors(FileInterceptor('arquivo', multerProdutoFinitoImagemConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem do produto' })
  async uploadImagem(
    @Param('id') id: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @CurrentLojaId() lojaId: string,
    @Req() req: Request,
  ) {
    return this.imagemService.upload({
      produtoId: id,
      lojaId,
      usuarioId: this.usuarioIdFromJwt(req),
      arquivo,
    });
  }

  @Patch(':id/imagens/reordenar')
  @ApiOperation({ summary: 'Reordena imagens da galeria' })
  reordenarImagens(
    @Param('id') id: string,
    @Body() dto: ReordenarImagensDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.imagemService.reordenarImagens({
      produtoId: id,
      lojaId,
      imagemIds: dto.imagem_ids,
    });
  }

  @Delete(':id/imagens/:imagemId')
  @ApiOperation({ summary: 'Remove imagem da galeria' })
  removerImagem(
    @Param('id') id: string,
    @Param('imagemId') imagemId: string,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.imagemService.removerImagem({
      produtoId: id,
      imagemId,
      lojaId,
    });
  }

  private usuarioIdFromJwt(req: Request): string {
    const user = req.user as { id?: string; sub?: string } | undefined;
    return String(user?.id || user?.sub || '');
  }
}
