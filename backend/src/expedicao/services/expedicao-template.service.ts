import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { ProdutosService } from '../../produtos/produtos.service';
import { CreateProdutoDto } from '../../produtos/dto/create-produto.dto';

type ProdutoOrcamentoCompleto = Awaited<
  ReturnType<ExpedicaoTemplateService['carregarProdutosOrcamento']>
>[number];

@Injectable()
export class ExpedicaoTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produtosService: ProdutosService,
  ) {}

  async transformarDeOs(
    osId: string,
    lojaId: string,
    nome: string,
  ): Promise<{
    os_id: string;
    orcamento_id: string;
    templates: Array<{ id: string; nome: string }>;
  }> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { id: true, orcamento_id: true },
    });

    if (!os) {
      throw new NotFoundException('OS não encontrada');
    }

    if (!os.orcamento_id) {
      throw new BadRequestException(
        'Esta OS não possui orçamento vinculado para clonar produtos.',
      );
    }

    const produtos = await this.carregarProdutosOrcamento(os.orcamento_id);

    if (produtos.length === 0) {
      throw new BadRequestException(
        'O orçamento não possui produtos ativos para transformar em template.',
      );
    }

    const templates: Array<{ id: string; nome: string }> = [];

    for (const [index, produto] of produtos.entries()) {
      const nomeTemplate =
        produtos.length === 1
          ? nome
          : `${nome} — ${produto.nome || produto.nome_servico || `Item ${index + 1}`}`;

      const dto = this.mapearProdutoParaDto(produto, nomeTemplate);
      const criado = await this.produtosService.create(dto, lojaId);
      templates.push({ id: criado.id, nome: criado.nome });
    }

    return {
      os_id: osId,
      orcamento_id: os.orcamento_id,
      templates,
    };
  }

  private async carregarProdutosOrcamento(orcamentoId: string) {
    return this.prisma.produtoOrcamento.findMany({
      where: { orcamento_id: orcamentoId, ativo: true },
      include: {
        insumos: true,
        maquinas: true,
        funcoes: true,
        servicos_manuais: true,
      },
      orderBy: { ordem: 'asc' },
    });
  }

  private mapearProdutoParaDto(
    produto: ProdutoOrcamentoCompleto,
    nome: string,
  ): CreateProdutoDto {
    const horasProducao = this.calcularHorasProducao(produto);

    return {
      nome,
      categoria: produto.categoria?.trim() || 'Geral',
      descricao: produto.descricao ?? undefined,
      nome_servico: produto.nome_servico,
      descricao_produto: produto.descricao ?? undefined,
      horas_producao: horasProducao,
      largura_produto: this.decimalParaNumero(produto.largura),
      altura_produto: this.decimalParaNumero(produto.altura),
      profundidade_produto: this.decimalParaNumero(produto.profundidade),
      area_produto: this.decimalParaNumero(produto.area_produto),
      perimetro_produto: this.decimalParaNumero(produto.perimetro_produto),
      unidade_geometria: produto.unidade_geometria ?? undefined,
      geometria_origem: produto.geometria_origem ?? undefined,
      arquivo_geometria_url: produto.arquivo_geometria_url ?? undefined,
      unidade_medida_produto: produto.unidade_medida ?? undefined,
      quantidade_padrao: this.decimalParaNumero(produto.quantidade),
      ativo: true,
      itens: produto.insumos.map((item) => ({
        insumo_id: item.insumo_id,
        quantidade: this.decimalParaNumero(item.quantidade) ?? 0,
        custo_unitario: this.decimalParaNumero(item.preco_unitario) ?? 0,
        custo_total: this.decimalParaNumero(item.preco_total) ?? 0,
        usa_medida_propria: item.usa_medida_propria,
        largura_material: this.decimalParaNumero(item.largura_material),
        altura_material: this.decimalParaNumero(item.altura_material),
        profundidade_material: this.decimalParaNumero(item.profundidade_material),
        unidade_medida_material: item.unidade_medida_material ?? undefined,
      })),
      maquinas: produto.maquinas.map((maquina) => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: this.decimalParaNumero(maquina.tempo_horas) ?? 0,
        custo_total: this.decimalParaNumero(maquina.custo_total) ?? 0,
      })),
      funcoes: produto.funcoes.map((funcao) => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: this.decimalParaNumero(funcao.tempo_horas) ?? 0,
        custo_total: this.decimalParaNumero(funcao.custo_total) ?? 0,
      })),
      servicos: produto.servicos_manuais.map((servico) => ({
        servico_id: servico.servico_id,
        horas_trabalhadas: this.decimalParaNumero(servico.tempo_horas) ?? 0,
        custo_total: this.decimalParaNumero(servico.custo_total) ?? 0,
      })),
    };
  }

  private calcularHorasProducao(produto: ProdutoOrcamentoCompleto): number {
    let total = 0;

    for (const maquina of produto.maquinas) {
      total += this.decimalParaNumero(maquina.tempo_horas) ?? 0;
    }
    for (const funcao of produto.funcoes) {
      total += this.decimalParaNumero(funcao.tempo_horas) ?? 0;
    }
    for (const servico of produto.servicos_manuais) {
      total += this.decimalParaNumero(servico.tempo_horas) ?? 0;
    }

    return Number(total.toFixed(2));
  }

  private decimalParaNumero(
    valor: Decimal | number | null | undefined,
  ): number | undefined {
    if (valor == null) return undefined;
    return Number(valor);
  }
}
