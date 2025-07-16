import { Controller, Get, Post, Body, Patch, Param, Delete, Request, BadRequestException } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { AcaoClienteDto } from './dto/acao-cliente.dto';
import { Public } from '../auth/public.decorator';

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly orcamentosService: OrcamentosService) {}

  @Post('calcular')
  async calcularOrcamento(@Body() dto: CalcularOrcamentoDto, @Request() req) {
    return this.orcamentosService.calcularOrcamento(dto, req.user.loja_id);
  }

  @Post('simular-cenarios')
  async simularCenarios(@Body() dto: CalcularOrcamentoDto, @Request() req) {
    return this.orcamentosService.simularCenarios(dto, req.user.loja_id);
  }

  @Post()
  create(@Body() createOrcamentoDto: CreateOrcamentoDto, @Request() req) {
    return this.orcamentosService.create(createOrcamentoDto, req.user.loja_id);
  }

  @Get()
  async findAll(@Request() req) {
    try {
      console.log('📋 Controller: Buscando orçamentos para usuário:', req.user);
      const result = await this.orcamentosService.findAll(req.user.loja_id);
      console.log('✅ Controller: Orçamentos retornados com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar orçamentos:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.orcamentosService.findOne(id, req.user.loja_id);
  }

  @Get(':id/publico')
  @Public()
  async findOnePublico(@Param('id') id: string) {
    const orcamento = await this.orcamentosService.findOnePublico(id);

    // Buscar o primeiro item de produto para obter nome_servico e descricao
    const primeiroItemProduto = orcamento.itens_produto?.[0];

    return {
      id: orcamento.id,
      numero: orcamento.numero,
      criado_em: orcamento.criado_em,
      nome_servico: primeiroItemProduto?.nome_servico || 'Orçamento',
      descricao: primeiroItemProduto?.descricao || '',
      horas_producao: 0, // Valor fixo ou ajuste conforme necessário
      custo_material: orcamento.custo_material,
      custo_mao_obra: orcamento.custo_mao_obra,
      custo_indireto: orcamento.custo_indireto,
      custo_total: orcamento.custo_total,
      margem_lucro: orcamento.margem_lucro,
      impostos: orcamento.impostos,
      preco_final: orcamento.preco_final,
      condicoes_comerciais: orcamento.condicoes_comerciais,
      status_aprovacao: orcamento.status_aprovacao,
      observacoes_cliente: orcamento.observacoes_cliente,
      cliente: orcamento.cliente,
      loja: {
        nome: orcamento.loja.nome,
        logo_url: orcamento.loja.logo_url,
        telefone: orcamento.loja.telefone,
        email: orcamento.loja.email,
      },
      itens_produto: orcamento.itens_produto?.map(item => ({
        id: item.id,
        nome_servico: item.nome_servico,
        descricao: item.descricao,
        largura_produto: item.largura_produto,
        altura_produto: item.altura_produto,
        unidade_medida_produto: item.unidade_medida_produto,
        area_produto: item.area_produto,
        ordem: item.ordem,
        itens_insumo: item.itens_insumo?.map(insumo => ({
          id: insumo.id,
          insumo: insumo.insumo,
          quantidade: insumo.quantidade,
          custo_unitario: insumo.custo_unitario,
          custo_total: insumo.custo_total,
        })),
      })),
      maquinas: orcamento.maquinas?.map(maquina => ({
        id: maquina.id,
        maquina: maquina.maquina,
        horas_utilizadas: maquina.horas_utilizadas,
        custo_total: maquina.custo_total,
      })),
      funcoes: orcamento.funcoes?.map(funcao => ({
        id: funcao.id,
        funcao: funcao.funcao,
        horas_trabalhadas: funcao.horas_trabalhadas,
        custo_total: funcao.custo_total,
      })),
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrcamentoDto: UpdateOrcamentoDto, @Request() req) {
    return this.orcamentosService.update(id, updateOrcamentoDto, req.user.loja_id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.orcamentosService.remove(id, req.user.loja_id);
  }

  @Post(':id/acao-cliente')
  @Public()
  async acaoCliente(@Param('id') id: string, @Body() acaoDto: AcaoClienteDto) {
    return this.orcamentosService.acaoCliente(id, acaoDto);
  }
}
