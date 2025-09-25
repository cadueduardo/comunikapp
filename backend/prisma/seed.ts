import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar uma loja de teste
  const loja = await prisma.loja.upsert({
    where: { id: 'test-loja-1' },
    update: {},
    create: {
      id: 'test-loja-1',
      nome: 'Loja Teste Comunikapp',
      email: 'teste@comunikapp.com',
      cnpj: '12.345.678/0001-90',
      telefone: '(11) 99999-9999',
      status: 'ATIVO',
      margem_lucro_padrao: 30,
      impostos_padrao: 10,
      horas_produtivas_mensais: 160,
      atualizado_em: new Date(),
    },
  });

  console.log('✅ Loja criada:', loja.nome);

  // Criar um usuário de teste
  const senhaHash = await bcrypt.hash('123456', 10);
  
  const usuario = await prisma.usuario.upsert({
    where: { id: 'test-user-1' },
    update: {},
    create: {
      id: 'test-user-1',
      nome_completo: 'Usuário Teste',
      email: 'usuario@teste.com',
      senha: senhaHash,
      telefone: '(11) 99999-9999',
      funcao: 'VENDAS',
      status: 'ATIVO',
      email_verificado: true,
      loja_id: loja.id,
    },
  });

  console.log('✅ Usuário criado:', usuario.nome_completo);

  // Criar categorias de teste
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        nome: 'Papel',
        loja_id: loja.id,
      },
    }),
    prisma.categoria.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        nome: 'Tinta',
        loja_id: loja.id,
      },
    }),
  ]);

  console.log('✅ Categorias criadas:', categorias.length);

  // Criar categorias V2 espelhadas para satisfazer FKs duplas em Insumo
  const categoriasV2 = await Promise.all([
    prisma.categoriaInsumo.upsert({
      where: { id: categorias[0].id },
      update: {},
      create: {
        id: categorias[0].id,
        nome: 'Papel',
        ativo: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
    }),
    prisma.categoriaInsumo.upsert({
      where: { id: categorias[1].id },
      update: {},
      create: {
        id: categorias[1].id,
        nome: 'Tinta',
        ativo: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      },
    }),
  ]);

  console.log('✅ Categorias V2 criadas:', categoriasV2.length);

  // Criar tipos de material de teste
  const tiposMaterial = await Promise.all([
    prisma.tipomaterial.upsert({
      where: { id: 'tipo-1' },
      update: {},
      create: {
        id: 'tipo-1',
        nome: 'Cordão',
        logica_consumo: 'custom',
        parametros_padrao: JSON.stringify({
          tipo_calculo: 'espacamento',
          espacamento: 10, // 10cm entre cada cordão
        }),
        descricao: 'Cordão para acabamento',
        loja: { connect: { id: loja.id } },
      atualizado_em: new Date(),
      },
    }),
    prisma.tipomaterial.upsert({
      where: { id: 'tipo-2' },
      update: {},
      create: {
        id: 'tipo-2',
        nome: 'Adesivo',
        logica_consumo: 'custom',
        parametros_padrao: JSON.stringify({
          tipo_calculo: 'quantidade_por_m2',
          quantidade_por_m2: 2, // 2 adesivos por m²
        }),
        descricao: 'Adesivo para fixação',
        loja: { connect: { id: loja.id } },
      atualizado_em: new Date(),
      },
    }),
  ]);

  console.log('✅ Tipos de material criados:', tiposMaterial.length);

  // Criar fornecedores de teste primeiro
  const fornecedores = await Promise.all([
    prisma.fornecedor.upsert({
      where: { id: 'fornecedor-1' },
      update: {},
      create: {
        id: 'fornecedor-1',
        nome: 'Fornecedor Teste',
        loja_id: loja.id,
      },
    }),
  ]);

  console.log('✅ Fornecedores criados:', fornecedores.length);

  // Criar insumos de teste
  const insumos = await Promise.all([
    prisma.insumo.upsert({
      where: { id: 'insumo-1' },
      update: {},
      create: {
        id: 'insumo-1',
        nome: 'Papel A4 90g',
        unidade_compra: 'RESMA',
        custo_unitario: 25.00,
        quantidade_compra: 500,
        unidade_uso: 'FOLHA',
        fator_conversao: 1,
        estoque_minimo: 10,
        logica_consumo: 'quantidade_fixa',
        categoriaId: categorias[0].id,
        fornecedorId: fornecedores[0].id,
        loja_id: loja.id,
      },
    }),
    prisma.insumo.upsert({
      where: { id: 'insumo-2' },
      update: {},
      create: {
        id: 'insumo-2',
        nome: 'Cordão Dourado',
        unidade_compra: 'M',
        custo_unitario: 15.00,
        quantidade_compra: 100,
        unidade_uso: 'CENTIMETRO',
        fator_conversao: 100,
        largura: 0.5,
        altura: 0.5,
        unidade_dimensao: 'CENTÍMETROS',
        tipo_calculo: 'COMPRIMENTO LINEAR',
        estoque_minimo: 5,
        logica_consumo: 'perimetro',
        tipoMaterialId: tiposMaterial[0].id,
        categoriaId: categorias[0].id,
        fornecedorId: fornecedores[0].id,
        loja_id: loja.id,
      },
    }),
  ]);

  console.log('✅ Insumos criados:', insumos.length);

  // Criar cliente de teste
  const cliente = await prisma.cliente.upsert({
    where: { id: 'cliente-1' },
    update: {},
    create: {
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
      telefone: '(11) 88888-8888',
      documento: '123.456.789-00',
      tipo_pessoa: 'PESSOA_FISICA' as any,
      status_cliente: 'ATIVO',
      loja_id: loja.id,
    },
  });

  console.log('✅ Cliente criado:', cliente.nome);

  // Criar máquinas de teste
  const maquinas = await Promise.all([
    prisma.maquina.upsert({
      where: { id: 'maquina-1' },
      update: {},
      create: {
        id: 'maquina-1',
        nome: 'Impressora HP LaserJet',
        tipo: 'IMPRESSAO',
        custo_hora: 50.00,
        status: 'ATIVO',
        loja_id: loja.id,
      },
    }),
    prisma.maquina.upsert({
      where: { id: 'maquina-2' },
      update: {},
      create: {
        id: 'maquina-2',
        nome: 'Plotter de Corte',
        tipo: 'CORTE',
        custo_hora: 80.00,
        status: 'ATIVO',
        loja_id: loja.id,
      },
    }),
  ]);

  console.log('✅ Máquinas criadas:', maquinas.length);

  // Criar funções de teste
  const funcoes = await Promise.all([
    prisma.funcao.upsert({
      where: { id: 'funcao-1' },
      update: {},
      create: {
        id: 'funcao-1',
        nome: 'Operador de Impressão',
        custo_hora: 25.00,
        descricao: 'Operação de impressoras e plotters',
        loja_id: loja.id,
      },
    }),
    prisma.funcao.upsert({
      where: { id: 'funcao-2' },
      update: {},
      create: {
        id: 'funcao-2',
        nome: 'Acabamento',
        custo_hora: 30.00,
        descricao: 'Acabamentos finais e montagem',
        loja_id: loja.id,
      },
    }),
  ]);

  console.log('✅ Funções criadas:', funcoes.length);

  // Criar custos indiretos de teste
  const custosIndiretos = await Promise.all([
    prisma.custoindireto.upsert({
      where: { id: 'custo-1' },
      update: {},
      create: {
        id: 'custo-1',
        nome: 'Aluguel',
        categoria: 'LOCACAO',
        valor_mensal: 5000.00,
        loja: { connect: { id: loja.id } },
      atualizado_em: new Date(),
      },
    }),
    prisma.custoindireto.upsert({
      where: { id: 'custo-2' },
      update: {},
      create: {
        id: 'custo-2',
        nome: 'Energia Elétrica',
        categoria: 'SERVICOS',
        valor_mensal: 1500.00,
        loja: { connect: { id: loja.id } },
      atualizado_em: new Date(),
      },
    }),
  ]);

  console.log('✅ Custos indiretos criados:', custosIndiretos.length);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Dados de acesso:');
  console.log('Email: usuario@teste.com');
  console.log('Senha: 123456');
  console.log('Loja: Loja Teste Comunikapp');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 