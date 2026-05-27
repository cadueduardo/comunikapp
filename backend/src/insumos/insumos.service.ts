import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { loja } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class InsumosService {
  constructor(private prisma: PrismaService) {}

  private toNumberOrZero(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    const parsed =
      typeof value === 'string'
        ? Number(value.replace(/\./g, '').replace(',', '.'))
        : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private parseOptionalDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data de validade do estoque inválida.');
    }

    return date;
  }

  private async buscarOuCriarLocalizacaoPadrao(
    tx: any,
    lojaId: string,
    localizacaoId?: string,
  ) {
    if (localizacaoId) {
      const localizacao = await tx.estoque_localizacoes.findFirst({
        where: { id: localizacaoId, lojaId, ativo: true },
      });

      if (!localizacao) {
        throw new BadRequestException(
          'Localização de estoque não encontrada para esta loja.',
        );
      }

      return localizacao;
    }

    const localizacaoExistente = await tx.estoque_localizacoes.findFirst({
      where: { lojaId, ativo: true },
      orderBy: { createdAt: 'asc' },
    });

    if (localizacaoExistente) {
      return localizacaoExistente;
    }

    return tx.estoque_localizacoes.create({
      data: {
        codigo: `PADRAO-${lojaId.slice(0, 8).toUpperCase()}`,
        deposito: 'Principal',
        descricao: 'Localização padrão criada automaticamente',
        lojaId,
        ativo: true,
      },
    });
  }

  private async sincronizarInsumoComEstoque(
    tx: any,
    insumo: any,
    dto: Partial<CreateInsumoDto>,
    lojaId: string,
    usuarioId = 'sistema',
  ) {
    if (!dto.controlar_estoque) return null;

    const localizacao = await this.buscarOuCriarLocalizacaoPadrao(
      tx,
      lojaId,
      dto.estoque_localizacao_id,
    );

    const estoqueMinimo = this.toNumberOrZero(
      dto.estoque_minimo ?? insumo.estoque_minimo,
    );
    const estoqueMaximo =
      dto.estoque_maximo === undefined || dto.estoque_maximo === null
        ? null
        : this.toNumberOrZero(dto.estoque_maximo);
    const quantidadeInicial = this.toNumberOrZero(
      dto.estoque_quantidade_inicial,
    );

    const existente = await tx.estoque_itens.findFirst({
      where: {
        insumoId: insumo.id,
        localizacaoId: localizacao.id,
        lojaId,
      },
    });

    const dataItem = {
      codigo: insumo.codigo_interno || insumo.codigo || undefined,
      nome: insumo.nome,
      descricao: insumo.descricao_tecnica || insumo.descricao || null,
      unidadeMedida: insumo.unidade_compra,
      precoUnitario: insumo.custo_unitario,
      estoqueMinimo,
      estoqueMaximo,
      lote: dto.estoque_lote || null,
      dataValidade: this.parseOptionalDate(dto.estoque_data_validade),
      observacoes: dto.estoque_observacoes || null,
      ativo: true,
    };

    const item = existente
      ? await tx.estoque_itens.update({
          where: { id: existente.id },
          data: dataItem,
        })
      : await tx.estoque_itens.create({
          data: {
            insumoId: insumo.id,
            localizacaoId: localizacao.id,
            lojaId,
            quantidadeAtual: quantidadeInicial,
            quantidadeReservada: 0,
            dataUltimaMov: quantidadeInicial > 0 ? new Date() : null,
            ...dataItem,
          },
        });

    if (!existente && quantidadeInicial > 0) {
      await tx.estoque_movimentacoes.create({
        data: {
          estoqueId: item.id,
          tipo: 'ENTRADA',
          quantidade: quantidadeInicial,
          quantidadeAnterior: 0,
          quantidadePosterior: quantidadeInicial,
          documentoRef: `INSUMO-${insumo.id}`,
          usuarioId,
          lojaId,
          observacoes:
            dto.estoque_observacoes ||
            'Entrada inicial criada a partir do cadastro do insumo',
        },
      });
    }

    if (!existente && dto.estoque_lote && quantidadeInicial > 0) {
      await tx.estoque_lotes.create({
        data: {
          estoqueId: item.id,
          numeroLote: dto.estoque_lote,
          dataValidade: this.parseOptionalDate(dto.estoque_data_validade),
          quantidadeLote: quantidadeInicial,
          status: 'ATIVO',
          lojaId,
        },
      });
    }

    return item;
  }

  private worksheetToObjects(worksheet: ExcelJS.Worksheet): Record<string, unknown>[] {
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as ExcelJS.CellValue[];
    const normalizedHeaders = headers
      .slice(1)
      .map((header) => String(header ?? '').trim());

    const rows: Record<string, unknown>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const item: Record<string, unknown> = {};
      let hasValue = false;

      normalizedHeaders.forEach((header, index) => {
        if (!header) return;
        const cellValue = row.getCell(index + 1).value;
        const value =
          cellValue && typeof cellValue === 'object' && 'text' in cellValue
            ? cellValue.text
            : cellValue;
        item[header] = value ?? null;
        if (value !== null && value !== undefined && value !== '') {
          hasValue = true;
        }
      });

      if (hasValue) {
        rows.push(item);
      }
    });

    return rows;
  }

  private addJsonWorksheet(
    workbook: ExcelJS.Workbook,
    name: string,
    rows: Record<string, unknown>[],
    headers?: string[],
  ) {
    const columns =
      headers ??
      Array.from(
        rows.reduce((keys, row) => {
          Object.keys(row).forEach((key) => keys.add(key));
          return keys;
        }, new Set<string>()),
      );

    const worksheet = workbook.addWorksheet(name);
    worksheet.addRow(columns);
    rows.forEach((row) => {
      worksheet.addRow(columns.map((column) => row[column] ?? null));
    });
    worksheet.columns.forEach((column) => {
      column.width = Math.min(Math.max(String(column.header ?? '').length + 4, 16), 48);
    });
    return worksheet;
  }

  private readonly UNIDADES_COMPRA = [
    { value: 'UNID', label: 'UNIDADE', exemplo: 'Peças avulsas, parafusos' },
    { value: 'M', label: 'METRO', exemplo: 'Cabos, perfis lineares' },
    {
      value: 'M2',
      label: 'METRO QUADRADO',
      exemplo: 'Bobinas de lona, chapas',
    },
    {
      value: 'M3',
      label: 'METRO CÚBICO',
      exemplo: 'Volumes de espuma, blocos',
    },
    { value: 'CM', label: 'CENTÍMETRO', exemplo: 'Cordões, fitas' },
    {
      value: 'CM2',
      label: 'CENTÍMETRO QUADRADO',
      exemplo: 'Peças recortadas pequenas',
    },
    {
      value: 'KG',
      label: 'QUILOGRAMA',
      exemplo: 'Tintas em pó, materiais a granel',
    },
    { value: 'GRAMAS', label: 'GRAMAS', exemplo: 'Pigmentos, reagentes' },
    { value: 'LITRO', label: 'LITRO', exemplo: 'Tintas líquidas, solventes' },
    { value: 'ML', label: 'MILILITRO', exemplo: 'Toner, colas líquidas' },
    { value: 'BOBINA', label: 'BOBINA', exemplo: 'Bobina de lona, vinil' },
    { value: 'ROLO', label: 'ROLO', exemplo: 'Cordões, fitas' },
    { value: 'FOLHA', label: 'FOLHA', exemplo: 'Folhas individuais' },
    { value: 'RESMA', label: 'RESMA', exemplo: 'Papel A4 500 folhas' },
    { value: 'PACOTE', label: 'PACOTE', exemplo: 'Pacote com quantidade fixa' },
    { value: 'CX', label: 'CAIXA', exemplo: 'Caixas com acessórios' },
    { value: 'KIT', label: 'KIT', exemplo: 'Conjuntos montados' },
    { value: 'DUZIA', label: 'DUZIA', exemplo: '12 unidades' },
    { value: 'CENTO', label: 'CENTO', exemplo: '100 unidades' },
    { value: 'MILHEI', label: 'MILHEIRO', exemplo: '1000 unidades' },
    { value: 'PARES', label: 'PARES', exemplo: 'Luvas, itens em pares' },
  ];

  private readonly UNIDADES_USO = this.UNIDADES_COMPRA;

  private readonly UNIDADES_DIMENSAO = [
    { value: 'M', label: 'METROS' },
    { value: 'CM', label: 'CENTÍMETROS' },
    { value: 'MM', label: 'MILÍMETROS' },
    { value: 'IN', label: 'POLEGADAS' },
    { value: 'FT', label: 'PÉS' },
  ];

  private readonly TIPOS_CALCULO = [
    { value: 'AREA', label: 'ÁREA (Largura × Altura)' },
    { value: 'LINEAR', label: 'COMPRIMENTO LINEAR' },
    { value: 'QUANTIDADE', label: 'QUANTIDADE DE ITENS' },
    { value: 'PESO', label: 'PESO' },
    { value: 'VOLUME', label: 'VOLUME' },
    { value: 'PERSONALIZADO', label: 'PERSONALIZADO (Tipos de Material)' },
  ];

  private readonly LOGICAS_CONSUMO = [
    { value: 'area', label: 'Área (m²)' },
    { value: 'perimetro', label: 'Perímetro (m)' },
    { value: 'quantidade_fixa', label: 'Quantidade fixa' },
    { value: 'custom', label: 'Personalizado' },
  ];

  private toNormalized(value: string): string {
    return value
      ?.toString()
      .normalize('NFD')
      .replace(/[^\p{L}\p{N}]+/gu, '')
      .toUpperCase();
  }

  private resolveOption(
    value: string | null | undefined,
    list: Array<{ value: string; label: string }>,
    campo: string,
    obrigatorio = true,
  ): string | null {
    if (value === undefined || value === null || value === '') {
      if (obrigatorio) {
        throw new BadRequestException(`Campo "${campo}" é obrigatório.`);
      }
      return null;
    }

    const normalized = this.toNormalized(String(value));
    const found = list.find(
      (item) =>
        this.toNormalized(item.value) === normalized ||
        this.toNormalized(item.label) === normalized,
    );

    if (!found) {
      throw new BadRequestException(
        `Valor "${value}" inválido para o campo "${campo}". Consulte a aba de referência do template.`,
      );
    }

    return found.value;
  }

  private getPrimeiroCampo(linha: any, chaves: string[]): any {
    for (const chave of chaves) {
      if (linha && Object.prototype.hasOwnProperty.call(linha, chave)) {
        return linha[chave];
      }
    }
    return undefined;
  }

  private obterValor(
    linha: any,
    chaves: string[],
    label: string,
    obrigatorio = true,
  ): any {
    const valor = this.getPrimeiroCampo(linha, chaves);
    if (
      (valor === undefined || valor === null || valor === '') &&
      obrigatorio
    ) {
      throw new BadRequestException(`Campo "${label}" é obrigatório.`);
    }
    return valor;
  }

  private sanitizarTexto(valor: string): string {
    return valor?.toString().replace(/\s+/g, ' ').trim();
  }

  private toNullableString(valor: any): string | null {
    if (valor === undefined || valor === null) {
      return null;
    }
    const texto = String(valor).trim();
    return texto === '' ? null : texto;
  }

  private parseDecimal(
    valor: any,
    campo: string,
    obrigatorio = false,
  ): number | null {
    if (valor === undefined || valor === null || valor === '') {
      if (obrigatorio) {
        throw new BadRequestException(`Campo "${campo}" é obrigatório.`);
      }
      return null;
    }

    if (typeof valor === 'number' && !Number.isNaN(valor)) {
      return valor;
    }

    const textoOriginal = String(valor).trim();

    if (textoOriginal === '') {
      if (obrigatorio) {
        throw new BadRequestException(`Campo "${campo}" é obrigatório.`);
      }
      return null;
    }

    let normalizado = textoOriginal.replace(/\s+/g, '');

    if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(normalizado)) {
      normalizado = normalizado.replace(/\./g, '').replace(',', '.');
    } else {
      normalizado = normalizado.replace(',', '.');
    }

    const numero = Number(normalizado);

    if (Number.isNaN(numero)) {
      throw new BadRequestException(
        `Campo "${campo}" deve ser numérico. Valor recebido: "${textoOriginal}".`,
      );
    }

    return numero;
  }

  private arredondar(valor: number, casas: number): number {
    const fator = 10 ** casas;
    return Math.round(valor * fator) / fator;
  }

  private converterParaMetros(valor: number, unidade?: string | null): number {
    if (!valor || Number.isNaN(valor)) {
      return 0;
    }

    const unidadeNormalizada = (unidade || '').toUpperCase();

    switch (unidadeNormalizada) {
      case 'CM':
        return valor / 100;
      case 'MM':
        return valor / 1000;
      case 'FT':
        return valor * 0.3048;
      case 'IN':
        return valor * 0.0254;
      default:
        return valor;
    }
  }

  private calcularQuantidadeTotal(params: {
    quantidadeInformada: number | null;
    tipoCalculo?: string | null;
    largura?: number | null;
    altura?: number | null;
    quantidadeDimensionada?: number | null;
    unidadeDimensao?: string | null;
    fatorConversao?: number | null;
    custoTotal?: number | null;
  }): number {
    const {
      quantidadeInformada,
      tipoCalculo,
      largura,
      altura,
      quantidadeDimensionada,
      unidadeDimensao,
      fatorConversao,
      custoTotal,
    } = params;

    if (quantidadeInformada && quantidadeInformada > 0) {
      return this.arredondar(quantidadeInformada, 3);
    }

    const tipo = (tipoCalculo || '').toUpperCase();

    if (tipo === 'AREA' && largura && altura) {
      const larguraM = this.converterParaMetros(largura, unidadeDimensao);
      const alturaM = this.converterParaMetros(altura, unidadeDimensao);
      const area = larguraM * alturaM;
      if (area > 0) {
        return this.arredondar(area, 3);
      }
    }

    if (tipo === 'LINEAR') {
      const comprimento = altura ?? largura;
      if (comprimento) {
        const metros = this.converterParaMetros(comprimento, unidadeDimensao);
        if (metros > 0) {
          return this.arredondar(metros, 3);
        }
      }
    }

    if (quantidadeDimensionada && quantidadeDimensionada > 0) {
      return this.arredondar(quantidadeDimensionada, 3);
    }

    if (fatorConversao && fatorConversao > 0) {
      return this.arredondar(fatorConversao, 3);
    }

    if (custoTotal && custoTotal > 0) {
      return this.arredondar(custoTotal, 3);
    }

    return 1;
  }

  private async resolverCategoria(loja: loja, valor: string): Promise<string> {
    if (!valor) {
      throw new BadRequestException('Categoria é obrigatória.');
    }

    const textoSanitizado = this.sanitizarTexto(valor);
    if (!textoSanitizado) {
      throw new BadRequestException('Categoria é obrigatória.');
    }

    const categoriaExistente = await this.prisma.categoria.findFirst({
      where: {
        loja_id: loja.id,
        OR: [{ id: textoSanitizado }, { nome: textoSanitizado }],
      },
    });

    if (categoriaExistente) {
      await this.prisma.categoriaInsumo.upsert({
        where: { id: categoriaExistente.id },
        update: { nome: categoriaExistente.nome, ativo: true },
        create: {
          id: categoriaExistente.id,
          nome: categoriaExistente.nome,
          ativo: true,
          descricao: null,
        },
      });

      return categoriaExistente.id;
    }

    const categoriaInsumoExistente =
      await this.prisma.categoriaInsumo.findFirst({
        where: {
          OR: [{ id: textoSanitizado }, { nome: textoSanitizado }],
        },
      });

    if (categoriaInsumoExistente) {
      await this.prisma.categoria.upsert({
        where: { id: categoriaInsumoExistente.id },
        update: {
          nome: categoriaInsumoExistente.nome,
          loja_id: loja.id,
        },
        create: {
          id: categoriaInsumoExistente.id,
          nome: categoriaInsumoExistente.nome,
          loja_id: loja.id,
        },
      });

      return categoriaInsumoExistente.id;
    }

    const categoriaInsumoCriada = await this.prisma.categoriaInsumo.create({
      data: {
        nome: textoSanitizado,
        ativo: true,
      },
    });

    await this.prisma.categoria.create({
      data: {
        id: categoriaInsumoCriada.id,
        nome: textoSanitizado,
        loja_id: loja.id,
      },
    });

    return categoriaInsumoCriada.id;
  }

  private async resolverFornecedor(loja: loja, valor: string): Promise<string> {
    if (!valor) {
      throw new BadRequestException('Fornecedor é obrigatório.');
    }

    const textoSanitizado = this.sanitizarTexto(valor);
    if (!textoSanitizado) {
      throw new BadRequestException('Fornecedor é obrigatório.');
    }

    const fornecedorPorId = await this.prisma.fornecedor.findFirst({
      where: { id: textoSanitizado, loja_id: loja.id },
    });

    if (fornecedorPorId) {
      return fornecedorPorId.id;
    }

    const fornecedorPorNome = await this.prisma.fornecedor.findFirst({
      where: {
        loja_id: loja.id,
        nome: textoSanitizado,
      },
    });

    if (fornecedorPorNome) {
      return fornecedorPorNome.id;
    }

    const fornecedorCriado = await this.prisma.fornecedor.create({
      data: {
        nome: textoSanitizado,
        loja_id: loja.id,
      },
    });

    return fornecedorCriado.id;
  }

  async create(createInsumoDto: CreateInsumoDto, loja: loja) {
    console.log('🔍 InsumosService.create - DTO recebido:', {
      categoriaId: createInsumoDto.categoriaId,
      fornecedorId: createInsumoDto.fornecedorId,
      tipo_material_id: createInsumoDto.tipo_material_id,
    });

    // Verificar unicidade por fornecedor (apenas se fornecedor foi informado)
    if (createInsumoDto.fornecedorId && createInsumoDto.fornecedorId !== '') {
      const existingInsumo = await this.prisma.insumo.findFirst({
        where: {
          loja_id: loja.id,
          nome: createInsumoDto.nome,
          fornecedorId: createInsumoDto.fornecedorId,
        },
      });

      if (existingInsumo) {
        throw new ConflictException(
          `Já existe um insumo com o nome "${createInsumoDto.nome}" para este fornecedor.`,
        );
      }
    }

    // Verificar se categoria e fornecedor pertencem à mesma loja
    if (createInsumoDto.categoriaId && createInsumoDto.categoriaId !== '') {
      const categoria = await this.prisma.categoria.findFirst({
        where: { id: createInsumoDto.categoriaId, loja_id: loja.id },
      });

      console.log('🔍 Verificação de categoria:', {
        categoriaId: createInsumoDto.categoriaId,
        loja_id: loja.id,
        encontrada: !!categoria,
        categoria: categoria,
      });

      if (!categoria) {
        // Verificar se a categoria existe em outra loja
        const categoriaOutraLoja = await this.prisma.categoria.findUnique({
          where: { id: createInsumoDto.categoriaId },
        });

        console.error('❌ Categoria não encontrada:', {
          categoriaId: createInsumoDto.categoriaId,
          loja_id: loja.id,
          existeEmOutraLoja: !!categoriaOutraLoja,
          lojaCategoria: categoriaOutraLoja?.loja_id,
        });
        throw new BadRequestException(
          `Categoria não encontrada (ID: ${createInsumoDto.categoriaId}). Por favor, selecione uma categoria válida.`,
        );
      }
    } else {
      throw new BadRequestException(
        'Categoria é obrigatória para criar um insumo.',
      );
    }

    if (createInsumoDto.fornecedorId && createInsumoDto.fornecedorId !== '') {
      const fornecedor = await this.prisma.fornecedor.findFirst({
        where: { id: createInsumoDto.fornecedorId, loja_id: loja.id },
      });

      console.log('🔍 Verificação de fornecedor:', {
        fornecedorId: createInsumoDto.fornecedorId,
        loja_id: loja.id,
        encontrado: !!fornecedor,
        fornecedor: fornecedor,
      });

      if (!fornecedor) {
        console.error('❌ Fornecedor não encontrado:', {
          fornecedorId: createInsumoDto.fornecedorId,
          loja_id: loja.id,
        });
        throw new BadRequestException(
          `Fornecedor não encontrado (ID: ${createInsumoDto.fornecedorId}). Por favor, selecione um fornecedor válido.`,
        );
      }
    } else {
      throw new BadRequestException(
        'Fornecedor é obrigatório para criar um insumo.',
      );
    }

    // Remover campos que não existem no modelo Prisma e campos vazios de FK
    const {
      tipo_material_id,
      categoriaId,
      fornecedorId,
      controlar_estoque,
      estoque_localizacao_id,
      estoque_quantidade_inicial,
      estoque_maximo,
      estoque_lote,
      estoque_data_validade,
      estoque_observacoes,
      ...dataWithoutExtraFields
    } = createInsumoDto;

    // Converter parametros_consumo para string JSON se for objeto
    const quantidadeCalculada = this.calcularQuantidadeTotal({
      quantidadeInformada: this.parseDecimal(
        dataWithoutExtraFields.quantidade_compra,
        'Quantidade total',
      ),
      tipoCalculo: dataWithoutExtraFields.tipo_calculo,
      largura: dataWithoutExtraFields.largura,
      altura: dataWithoutExtraFields.altura,
      quantidadeDimensionada: undefined,
      unidadeDimensao: dataWithoutExtraFields.unidade_dimensao,
      fatorConversao: dataWithoutExtraFields.fator_conversao,
    });

    // Converter parametros_consumo para string JSON se for objeto
    let parametrosConsumoProcessado = null;
    if (dataWithoutExtraFields.parametros_consumo) {
      // Se já é uma string JSON, verificar se não está corrompida
      if (typeof dataWithoutExtraFields.parametros_consumo === 'string') {
        if (dataWithoutExtraFields.parametros_consumo.includes('\\\\\\"')) {
          console.warn('⚠️ Detectada string corrompida no create, ignorando');
          parametrosConsumoProcessado = null;
        } else {
          parametrosConsumoProcessado =
            dataWithoutExtraFields.parametros_consumo;
        }
      } else {
        parametrosConsumoProcessado = JSON.stringify(
          dataWithoutExtraFields.parametros_consumo,
        );
      }
    }

    const dataForPrisma = {
      ...dataWithoutExtraFields,
      parametros_consumo: parametrosConsumoProcessado,
      loja_id: loja.id,
      ...(tipo_material_id &&
        tipo_material_id !== '' && { tipoMaterialId: tipo_material_id }),
      ...(categoriaId && categoriaId !== '' && { categoriaId }),
      ...(fornecedorId && fornecedorId !== '' && { fornecedorId }),
      ativo: createInsumoDto.ativo ?? true,
      quantidade_compra: quantidadeCalculada,
    };

    console.log('🔍 InsumosService.create - dataForPrisma:', {
      categoriaId: dataForPrisma.categoriaId,
      fornecedorId: dataForPrisma.fornecedorId,
      tipoMaterialId: dataForPrisma.tipoMaterialId,
    });

    const { insumo, estoqueItem } = await this.prisma.$transaction(
      async (tx) => {
        const insumoCriado = await tx.insumo.create({
          data: dataForPrisma,
          include: {
            categoria: true,
            fornecedor: true,
            tipoMaterial: true,
          },
        });

        const itemCriado = await this.sincronizarInsumoComEstoque(
          tx,
          insumoCriado,
          {
            controlar_estoque,
            estoque_localizacao_id,
            estoque_quantidade_inicial,
            estoque_maximo,
            estoque_lote,
            estoque_data_validade,
            estoque_observacoes,
            estoque_minimo: dataWithoutExtraFields.estoque_minimo,
          },
          loja.id,
        );

        return { insumo: insumoCriado, estoqueItem: itemCriado };
      },
    );

    // Converter valores Decimal para números
    return {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
      estoque_controlado: Boolean(estoqueItem),
      estoque_item_id: estoqueItem?.id ?? null,
    };
  }

  async findAll(loja: loja) {
    const insumos = await this.prisma.insumo.findMany({
      where: { loja_id: loja.id },
      include: {
        categoria: true,
        fornecedor: true,
        tipoMaterial: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    // Converter valores Decimal para números e processar campos personalizados
    return insumos.map((insumo) => {
      const resultado = {
        ...insumo,
        custo_unitario: Number(insumo.custo_unitario),
        quantidade_compra: Number(insumo.quantidade_compra),
        fator_conversao: Number(insumo.fator_conversao),
        largura: insumo.largura ? Number(insumo.largura) : null,
        altura: insumo.altura ? Number(insumo.altura) : null,
        gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
      };

      // Processar parametros_consumo se existir
      if (
        resultado.parametros_consumo &&
        typeof resultado.parametros_consumo === 'string'
      ) {
        try {
          // Verificar se é uma string corrompida
          if (resultado.parametros_consumo.includes('\\\\\\"')) {
            console.warn(
              '⚠️ Detectada string corrompida no findAll, limpando parametros_consumo',
            );
            resultado.parametros_consumo = null;
          } else {
            resultado.parametros_consumo = JSON.parse(
              resultado.parametros_consumo,
            );
          }
        } catch (e) {
          console.warn(
            '⚠️ Erro ao parsear parametros_consumo no findAll:',
            e.message,
          );
          resultado.parametros_consumo = null;
        }
      }

      // Processar tipoMaterial.parametros_padrao se existir
      if (
        resultado.tipoMaterial &&
        resultado.tipoMaterial.parametros_padrao &&
        typeof resultado.tipoMaterial.parametros_padrao === 'string'
      ) {
        try {
          resultado.tipoMaterial.parametros_padrao = JSON.parse(
            resultado.tipoMaterial.parametros_padrao,
          );
        } catch (e) {
          console.warn(
            '⚠️ Erro ao parsear tipoMaterial.parametros_padrao no findAll:',
            e.message,
          );
          resultado.tipoMaterial.parametros_padrao = null;
        }
      }

      return resultado;
    });
  }

  async findOne(id: string, loja: loja) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
      include: {
        categoria: true,
        fornecedor: true,
        tipoMaterial: true,
      },
    });

    if (!insumo) {
      throw new NotFoundException(`Insumo com ID "${id}" não encontrado.`);
    }

    if (insumo.loja_id !== loja.id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    // Converter valores Decimal para números
    const estoqueItem = await this.prisma.estoque_itens.findFirst({
      where: {
        insumoId: id,
        lojaId: loja.id,
        ativo: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const resultado = {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
      estoque_controlado: Boolean(estoqueItem),
      controlar_estoque: Boolean(estoqueItem),
      estoque_item_id: estoqueItem?.id ?? null,
      estoque_localizacao_id: estoqueItem?.localizacaoId ?? '',
      estoque_quantidade_inicial: estoqueItem
        ? Number(estoqueItem.quantidadeAtual)
        : '',
      estoque_maximo: estoqueItem?.estoqueMaximo
        ? Number(estoqueItem.estoqueMaximo)
        : '',
      estoque_lote: estoqueItem?.lote ?? '',
      estoque_data_validade: estoqueItem?.dataValidade
        ? estoqueItem.dataValidade.toISOString().slice(0, 10)
        : '',
      estoque_observacoes: estoqueItem?.observacoes ?? '',
    };

    // Processar parametros_consumo para evitar problemas de serialização
    if (
      resultado.parametros_consumo &&
      typeof resultado.parametros_consumo === 'string'
    ) {
      try {
        // Verificar se é uma string corrompida
        if (resultado.parametros_consumo.includes('\\\\\\"')) {
          console.warn(
            '⚠️ Detectada string corrompida, limpando parametros_consumo',
          );
          resultado.parametros_consumo = null;
        } else {
          resultado.parametros_consumo = JSON.parse(
            resultado.parametros_consumo,
          );
        }
      } catch (e) {
        console.warn('⚠️ Erro ao parsear parametros_consumo:', e.message);
        resultado.parametros_consumo = null;
      }
    }

    console.log('🔍 InsumosService.findOne - Dados retornados:', {
      logica_consumo: resultado.logica_consumo,
      tipoMaterialId: resultado.tipoMaterialId,
      parametros_consumo: resultado.parametros_consumo,
      tipoMaterial: resultado.tipoMaterial,
      // Verificar se o campo está sendo retornado corretamente
      camposCompletos: {
        id: resultado.id,
        nome: resultado.nome,
        logica_consumo: resultado.logica_consumo,
        tipoMaterialId: resultado.tipoMaterialId,
        parametros_consumo: resultado.parametros_consumo,
      },
    });

    return resultado;
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto, loja: loja) {
    const existingInsumo = await this.findOne(id, loja);

    // TODO: Implementar histórico de preços após migração
    // Se o custo unitário foi alterado, registrar no histórico
    // if (updateInsumoDto.custo_unitario && updateInsumoDto.custo_unitario !== Number(insumo.custo_unitario)) {
    //   await this.prisma.historicoPrecoInsumo.create({
    //     data: {
    //       insumo_id: id,
    //       custo_anterior: insumo.custo_unitario,
    //       custo_novo: updateInsumoDto.custo_unitario,
    //       motivo: updateInsumoDto.motivo_alteracao_preco || 'Alteração de preço',
    //     },
    //   });
    // }

    // Verificar unicidade se o nome foi alterado
    if (updateInsumoDto.nome && updateInsumoDto.nome !== existingInsumo.nome) {
      const existingInsumoWithSameName = await this.prisma.insumo.findFirst({
        where: {
          loja_id: loja.id,
          nome: updateInsumoDto.nome,
          fornecedorId: existingInsumo.fornecedorId,
          id: { not: id },
        },
      });

      if (existingInsumoWithSameName) {
        throw new ConflictException(
          `Já existe um insumo com o nome "${updateInsumoDto.nome}" para este fornecedor.`,
        );
      }
    }

    // Remover campos que não existem no modelo Prisma
    const {
      tipo_material_id,
      controlar_estoque,
      estoque_localizacao_id,
      estoque_quantidade_inicial,
      estoque_maximo,
      estoque_lote,
      estoque_data_validade,
      estoque_observacoes,
      ...dataWithoutExtraFields
    } = updateInsumoDto;

    console.log('🔍 InsumosService.update - Dados recebidos:', {
      logica_consumo: updateInsumoDto.logica_consumo,
      tipo_material_id: tipo_material_id,
      parametros_consumo: updateInsumoDto.parametros_consumo,
    });

    // Converter parametros_consumo para string JSON se for objeto
    let parametrosConsumoProcessado = null;
    if (dataWithoutExtraFields.parametros_consumo) {
      // Se já é uma string JSON, verificar se não está corrompida
      if (typeof dataWithoutExtraFields.parametros_consumo === 'string') {
        if (dataWithoutExtraFields.parametros_consumo.includes('\\\\\\"')) {
          console.warn('⚠️ Detectada string corrompida no update, ignorando');
          parametrosConsumoProcessado = null;
        } else {
          parametrosConsumoProcessado =
            dataWithoutExtraFields.parametros_consumo;
        }
      } else {
        parametrosConsumoProcessado = JSON.stringify(
          dataWithoutExtraFields.parametros_consumo,
        );
      }
    }

    const dataForPrisma = {
      ...dataWithoutExtraFields,
      parametros_consumo: parametrosConsumoProcessado,
      ...(tipo_material_id &&
        tipo_material_id !== '' && { tipoMaterialId: tipo_material_id }),
    };

    console.log('🔍 InsumosService.update - Dados para Prisma:', {
      logica_consumo: dataForPrisma.logica_consumo,
      tipoMaterialId: dataForPrisma.tipoMaterialId,
      parametros_consumo: dataForPrisma.parametros_consumo,
    });

    const { insumo, estoqueItem } = await this.prisma.$transaction(
      async (tx) => {
        const insumoAtualizado = await tx.insumo.update({
          where: { id },
          data: dataForPrisma,
          include: {
            categoria: true,
            fornecedor: true,
            tipoMaterial: true,
          },
        });

        const itemAtualizado = await this.sincronizarInsumoComEstoque(
          tx,
          insumoAtualizado,
          {
            controlar_estoque,
            estoque_localizacao_id,
            estoque_quantidade_inicial,
            estoque_maximo,
            estoque_lote,
            estoque_data_validade,
            estoque_observacoes,
            estoque_minimo: dataWithoutExtraFields.estoque_minimo,
          },
          loja.id,
        );

        return { insumo: insumoAtualizado, estoqueItem: itemAtualizado };
      },
    );

    // Converter valores Decimal para números
    const resultado = {
      ...insumo,
      custo_unitario: Number(insumo.custo_unitario),
      quantidade_compra: Number(insumo.quantidade_compra),
      fator_conversao: Number(insumo.fator_conversao),
      largura: insumo.largura ? Number(insumo.largura) : null,
      altura: insumo.altura ? Number(insumo.altura) : null,
      gramatura: insumo.gramatura ? Number(insumo.gramatura) : null,
      estoque_controlado: Boolean(estoqueItem),
      estoque_item_id: estoqueItem?.id ?? null,
    };

    // Processar parametros_consumo para evitar problemas de serialização
    if (
      resultado.parametros_consumo &&
      typeof resultado.parametros_consumo === 'string'
    ) {
      try {
        // Verificar se é uma string corrompida
        if (resultado.parametros_consumo.includes('\\\\\\"')) {
          console.warn(
            '⚠️ Detectada string corrompida no update, limpando parametros_consumo',
          );
          resultado.parametros_consumo = null;
        } else {
          resultado.parametros_consumo = JSON.parse(
            resultado.parametros_consumo,
          );
        }
      } catch (e) {
        console.warn(
          '⚠️ Erro ao parsear parametros_consumo no update:',
          e.message,
        );
        resultado.parametros_consumo = null;
      }
    }

    return resultado;
  }

  async remove(id: string, loja: loja) {
    const existingInsumo = await this.findOne(id, loja);

    // Verifica se o insumo está sendo usado em orçamentos
    const itensOrcamento = await this.prisma.itemorcamento.findMany({
      where: { insumo_id: id },
      include: {
        orcamento: true,
      },
    });

    if (itensOrcamento.length > 0) {
      const orcamentosUsando = itensOrcamento
        .map(
          (item) =>
            `Orçamento #${item.orcamento.numero} - ${item.orcamento.nome_servico}`,
        )
        .join(', ');

      throw new BadRequestException(
        `Não é possível excluir este insumo pois ele está sendo usado nos seguintes orçamentos: ${orcamentosUsando}. ` +
          'Remova o insumo dos orçamentos antes de excluí-lo.',
      );
    }

    await this.prisma.insumo.delete({
      where: { id },
    });

    return {
      message: `Insumo "${existingInsumo.nome}" foi removido com sucesso.`,
    };
  }

  async importarExcel(file: Express.Multer.File, loja: loja) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    const rows = sheet ? this.worksheetToObjects(sheet) : [];

    if (!rows || rows.length === 0) {
      throw new BadRequestException('Planilha vazia ou inválida.');
    }

    const resultados: {
      sucesso: number;
      erros: { linha: number; motivo: string }[];
    } = {
      sucesso: 0,
      erros: [],
    };

    for (let i = 0; i < rows.length; i += 1) {
      const linha = rows[i];
      try {
        const nome = this.obterValor(
          linha,
          ['Nome do insumo *', 'nome'],
          'Nome do insumo',
        );

        const categoriaId = await this.resolverCategoria(
          loja,
          this.obterValor(
            linha,
            ['Categoria (ID ou nome exato) *', 'categoriaId'],
            'Categoria',
          ),
        );

        console.log(
          '\u270F\uFE0F Importação de insumos - categoria resolvida',
          JSON.stringify({
            linha: i + 2,
            valorCategoria:
              linha['Categoria (ID ou nome exato) *'] ?? linha.categoriaId,
            categoriaId,
            loja: loja.id,
          }),
        );

        const fornecedorId = await this.resolverFornecedor(
          loja,
          this.obterValor(
            linha,
            ['Fornecedor (ID ou nome exato) *', 'fornecedorId'],
            'Fornecedor',
          ),
        );

        const unidadeCompra = this.resolveOption(
          this.obterValor(
            linha,
            ['Unidade de compra *', 'unidade_compra'],
            'Unidade de compra',
          ),
          this.UNIDADES_COMPRA,
          'Unidade de compra',
        );

        const unidadeUso = this.resolveOption(
          this.obterValor(
            linha,
            ['Unidade de uso *', 'unidade_uso'],
            'Unidade de uso',
          ),
          this.UNIDADES_USO,
          'Unidade de uso',
        );

        const fatorConversao =
          this.parseDecimal(
            this.obterValor(
              linha,
              ['Fator de conversão *', 'fator_conversao'],
              'Fator de conversão',
            ),
            'Fator de conversão',
            true,
          ) ?? 1;

        const unidadeDimensao = this.toNullableString(
          this.obterValor(
            linha,
            ['Unidade das dimensões', 'unidade_dimensao'],
            'Unidade das dimensões',
            false,
          ),
        );

        const unidadeDimensaoNormalizada = unidadeDimensao
          ? this.resolveOption(
              unidadeDimensao,
              this.UNIDADES_DIMENSAO,
              'Unidade das dimensões',
              false,
            )
          : null;

        const tipoCalculo = this.toNullableString(
          this.obterValor(
            linha,
            ['Tipo de cálculo', 'tipo_calculo'],
            'Tipo de cálculo',
            false,
          ),
        );

        const tipoCalculoNormalizado = tipoCalculo
          ? this.resolveOption(
              tipoCalculo,
              this.TIPOS_CALCULO,
              'Tipo de cálculo',
              false,
            )
          : null;

        const quantidadeInformada = this.parseDecimal(
          this.obterValor(
            linha,
            ['Quantidade total', 'quantidade_compra'],
            'Quantidade total',
            false,
          ),
          'Quantidade total',
        );

        const largura = this.parseDecimal(
          this.obterValor(linha, ['Largura', 'largura'], 'Largura', false),
          'Largura',
        );

        const altura = this.parseDecimal(
          this.obterValor(
            linha,
            ['Altura', 'Altura / Comprimento', 'altura'],
            'Altura',
            false,
          ),
          'Altura',
        );

        const custoTotal =
          this.parseDecimal(
            this.obterValor(
              linha,
              ['Custo total (R$) *', 'custo_unitario'],
              'Custo total (R$)',
            ),
            'Custo total (R$)',
            true,
          ) ?? 0;

        const quantidadeDimensionada = this.parseDecimal(
          this.obterValor(
            linha,
            ['Quantidade dimensionada', 'quantidadeDimensionada'],
            'Quantidade dimensionada',
            false,
          ),
          'Quantidade dimensionada',
        );

        const quantidadeCalculada = this.calcularQuantidadeTotal({
          quantidadeInformada,
          tipoCalculo: tipoCalculoNormalizado,
          largura,
          altura,
          quantidadeDimensionada,
          unidadeDimensao: unidadeDimensaoNormalizada,
          fatorConversao,
          custoTotal,
        });

        const descricaoTecnica = this.toNullableString(
          this.obterValor(
            linha,
            ['Descrição técnica', 'descricao_tecnica'],
            'Descrição técnica',
            false,
          ),
        );

        const codigoInterno = this.toNullableString(
          this.obterValor(
            linha,
            ['Código interno', 'codigo_interno'],
            'Código interno',
            false,
          ),
        );

        const estoqueMinimo = this.parseDecimal(
          this.obterValor(
            linha,
            ['Estoque mínimo', 'estoque_minimo'],
            'Estoque mínimo',
            false,
          ),
          'Estoque mínimo',
        );

        const tipoMaterialValor = this.toNullableString(
          this.obterValor(
            linha,
            ['Tipo de material (ID ou nome)', 'tipoMaterialId'],
            'Tipo de material',
            false,
          ),
        );

        const parametrosConsumoValor = this.obterValor(
          linha,
          ['Parâmetros de consumo (JSON)', 'parametros_consumo'],
          'Parâmetros de consumo (JSON)',
          false,
        );

        let parametrosConsumo: any = null;
        if (parametrosConsumoValor) {
          try {
            parametrosConsumo =
              typeof parametrosConsumoValor === 'string'
                ? JSON.parse(parametrosConsumoValor)
                : parametrosConsumoValor;
          } catch (error) {
            throw new BadRequestException(
              'Campo parametros_consumo inválido. Use JSON válido.',
            );
          }
        }

        const dto: CreateInsumoDto = {
          nome,
          categoriaId,
          fornecedorId,
          unidade_compra: unidadeCompra,
          quantidade_compra: quantidadeCalculada,
          custo_unitario: custoTotal,
          unidade_uso: unidadeUso,
          fator_conversao: fatorConversao,
          unidade_dimensao: unidadeDimensaoNormalizada ?? undefined,
          tipo_calculo: tipoCalculoNormalizado ?? undefined,
          largura: largura ?? undefined,
          altura: altura ?? undefined,
          descricao_tecnica: descricaoTecnica ?? undefined,
          codigo_interno: codigoInterno ?? undefined,
          estoque_minimo:
            estoqueMinimo !== null ? Math.round(estoqueMinimo) : undefined,
          tipo_material_id: tipoMaterialValor ?? undefined,
          parametros_consumo: parametrosConsumo ?? undefined,
        } as CreateInsumoDto;

        if (!dto.quantidade_compra || dto.quantidade_compra <= 0) {
          throw new BadRequestException(
            'Não foi possível calcular a quantidade total. Informe manualmente ou preencha largura/altura/tipo de cálculo.',
          );
        }

        if (
          dto.quantidade_compra > 0 &&
          !Number.isFinite(dto.quantidade_compra)
        ) {
          throw new BadRequestException(
            'Quantidade total calculada inválida. Verifique os valores informados.',
          );
        }

        await this.create(dto, loja);
        resultados.sucesso += 1;
      } catch (err: any) {
        resultados.erros.push({
          linha: i + 2,
          motivo: err?.message || 'Erro desconhecido',
        });
      }
    }

    return resultados;
  }

  async gerarTemplateImportacao(
    loja: loja,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const headers = [
      'Nome do insumo *',
      'Categoria (ID ou nome exato) *',
      'Fornecedor (ID ou nome exato) *',
      'Unidade de compra *',
      'Quantidade total *',
      'Custo total (R$) *',
      'Unidade de uso *',
      'Fator de conversão *',
      'Unidade das dimensões',
      'Tipo de cálculo',
      'Largura',
      'Altura / Comprimento',
      'Descrição técnica',
      'Código interno',
      'Estoque mínimo',
      'Tipo de material (ID ou nome)',
      'Parâmetros de consumo (JSON)',
    ];

    const exemplo = [
      {
        'Nome do insumo *': 'Lona Front 440g',
        'Categoria (ID ou nome exato) *': 'Lonas e Frontlight',
        'Fornecedor (ID ou nome exato) *': 'Fornecedor Teste',
        'Unidade de compra *': 'BOBINA',
        'Quantidade total *': 50,
        'Custo total (R$) *': 280.5,
        'Unidade de uso *': 'M2',
        'Fator de conversão *': 1,
        'Unidade das dimensões': 'M',
        'Tipo de cálculo': 'ÁREA (Largura × Altura)',
        Largura: 1.6,
        'Altura / Comprimento': 30,
        'Descrição técnica': 'Bobina de lona front 440g com 1,60m x 30m',
        'Código interno': 'LONA-440G',
        'Estoque mínimo': 2,
        'Tipo de material (ID ou nome)': '',
        'Parâmetros de consumo (JSON)': '',
      },
    ];

    const explicacoes: Record<string, string>[] = [
      {
        Campo: 'Nome do insumo *',
        'Como preencher': 'Nome amigável do insumo. Ex: Lona Front 440g',
      },
      {
        Campo: 'Categoria (ID ou nome exato) *',
        'Como preencher':
          'Use o ID ou o nome exatamente igual cadastrado. Veja a tabela de categorias abaixo.',
      },
      {
        Campo: 'Fornecedor (ID ou nome exato) *',
        'Como preencher':
          'Use o ID ou o nome exatamente igual cadastrado. Veja a tabela de fornecedores abaixo.',
      },
      {
        Campo: 'Unidade de compra *',
        'Como preencher':
          'Como você compra esse insumo. Ex: BOBINA, ROLO, LITRO. Veja opções abaixo.',
      },
      {
        Campo: 'Quantidade total *',
        'Como preencher':
          'Quantidade total equivalente à unidade de compra (ex: 50 para bobina 1,60x30 = 50 m²).',
      },
      {
        Campo: 'Custo total (R$) *',
        'Como preencher':
          'Preço total pago na unidade de compra (não unitário).',
      },
      {
        Campo: 'Unidade de uso *',
        'Como preencher':
          'Como o insumo é consumido nos produtos. Ex: M2, M, UNIDADE. Veja opções abaixo.',
      },
      {
        Campo: 'Fator de conversão *',
        'Como preencher':
          'Normalmente 1.0. Use outro valor apenas se a unidade de compra for diferente da unidade de uso.',
      },
      {
        Campo: 'Unidade das dimensões',
        'Como preencher':
          'Unidade usada nas colunas Largura/Altura. Ex: M, CM. Use se quiser cálculo automático.',
      },
      {
        Campo: 'Tipo de cálculo',
        'Como preencher':
          'Forma de cálculo automático: Área, Linear, Quantidade, Peso, Volume. Veja opções.',
      },
      {
        Campo: 'Largura / Altura / Comprimento',
        'Como preencher':
          'Informe dimensões para cálculo automático. Ex: largura 1.6 e comprimento 30 (metros).',
      },
      {
        Campo: 'Descrição técnica / Código interno',
        'Como preencher':
          'Campos opcionais para descrição detalhada e código interno legados.',
      },
      {
        Campo: 'Estoque mínimo',
        'Como preencher': 'Quantidade mínima desejada para alertas.',
      },
      {
        Campo: 'Tipo de material (ID ou nome)',
        'Como preencher':
          'Obrigatório apenas se Tipo de cálculo = PERSONALIZADO.',
      },
      {
        Campo: 'Parâmetros de consumo (JSON)',
        'Como preencher':
          'Use JSON apenas para lógica personalizada. Ex: {"tipo":"quantidade_fixa","valor":2}',
      },
    ];

    const unidadesCompra = this.UNIDADES_COMPRA.map((opcao) => ({
      Valor: opcao.value,
      Exibir: opcao.label,
      Exemplo: opcao.exemplo ?? '',
    }));
    const unidadesUso = this.UNIDADES_USO.map((opcao) => ({
      Valor: opcao.value,
      Exibir: opcao.label,
      Exemplo: opcao.exemplo ?? '',
    }));
    const unidadesDim = this.UNIDADES_DIMENSAO.map((opcao) => ({
      Valor: opcao.value,
      Exibir: opcao.label,
    }));
    const tiposCalc = this.TIPOS_CALCULO.map((opcao) => ({
      Valor: opcao.value,
      Exibir: opcao.label,
    }));
    const logicas = this.LOGICAS_CONSUMO.map((opcao) => ({
      Valor: opcao.value,
      Exibir: opcao.label,
    }));
    const categoriasLoja = await this.prisma.categoria.findMany({
      where: { loja_id: loja.id },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
    const fornecedoresLoja = await this.prisma.fornecedor.findMany({
      where: { loja_id: loja.id },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    this.addJsonWorksheet(workbook, 'Importar_Insumos', exemplo, headers);
    this.addJsonWorksheet(workbook, 'Guia_de_Preenchimento', explicacoes);
    this.addJsonWorksheet(workbook, 'Unidade_Compra', unidadesCompra);
    this.addJsonWorksheet(workbook, 'Unidade_Uso', unidadesUso);
    this.addJsonWorksheet(workbook, 'Unidade_Dimensao', unidadesDim);
    this.addJsonWorksheet(workbook, 'Tipos_Calculo', tiposCalc);
    this.addJsonWorksheet(workbook, 'Logicas_Consumo', logicas);
    this.addJsonWorksheet(
      workbook,
      'Categorias_da_Loja',
      categoriasLoja.map((cat) => ({ ID: cat.id, Nome: cat.nome })),
    );
    this.addJsonWorksheet(
      workbook,
      'Fornecedores_da_Loja',
      fornecedoresLoja.map((forn) => ({ ID: forn.id, Nome: forn.nome })),
    );

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, filename: 'template-importacao-insumos.xlsx' };
  }

  // TODO: Implementar após migração
  // Novo método para buscar insumos com filtros
  // async search(query: string, loja: loja) {
  //   return this.prisma.insumo.findMany({
  //     where: {
  //       loja_id: loja.id,
  //       OR: [
  //         { nome: { contains: query, mode: 'insensitive' } },
  //         { codigo_interno: { contains: query, mode: 'insensitive' } },
  //         { descricao_tecnica: { contains: query, mode: 'insensitive' } },
  //       ],
  //     },
  //     include: {
  //       categoria: true,
  //       fornecedor: true,
  //     },
  //     orderBy: { nome: 'asc' },
  //   });
  // }

  // TODO: Implementar após migração
  // Novo método para buscar insumos ativos
  // async findActive(loja: loja) {
  //   return this.prisma.insumo.findMany({
  //     where: {
  //       loja_id: loja.id,
  //       ativo: true,
  //     },
  //     include: {
  //       categoria: true,
  //       fornecedor: true,
  //     },
  //     orderBy: { nome: 'asc' },
  //   });
  // }
}
