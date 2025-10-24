import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKanbanTest() {
  console.log('🌱 Iniciando seed de dados de teste para Kanban...');

  try {
    // Buscar uma loja existente
    const loja = await prisma.loja.findFirst();
    if (!loja) {
      throw new Error('Nenhuma loja encontrada. Crie uma loja primeiro.');
    }

    // Buscar um cliente existente
    const cliente = await prisma.cliente.findFirst();
    if (!cliente) {
      throw new Error('Nenhum cliente encontrado. Crie um cliente primeiro.');
    }

    // Buscar um usuário existente
    const usuario = await prisma.usuario.findFirst();
    if (!usuario) {
      throw new Error('Nenhum usuário encontrado. Crie um usuário primeiro.');
    }

    console.log(`📋 Usando loja: ${loja.nome} (${loja.id})`);
    console.log(`👤 Usando cliente: ${cliente.nome} (${cliente.id})`);
    console.log(`👨‍💼 Usando usuário: ${usuario.nome} (${usuario.id})`);

    // Criar setores produtivos de teste
    const setores = await Promise.all([
      prisma.setorProdutivo.upsert({
        where: { id: 'setor-corte' },
        update: {},
        create: {
          id: 'setor-corte',
          loja_id: loja.id,
          nome: 'Corte',
          descricao: 'Setor responsável pelo corte de materiais',
          cor: '#FF6B6B',
          ativo: true,
          ordem: 1
        }
      }),
      prisma.setorProdutivo.upsert({
        where: { id: 'setor-impressao' },
        update: {},
        create: {
          id: 'setor-impressao',
          loja_id: loja.id,
          nome: 'Impressão',
          descricao: 'Setor responsável pela impressão',
          cor: '#4ECDC4',
          ativo: true,
          ordem: 2
        }
      }),
      prisma.setorProdutivo.upsert({
        where: { id: 'setor-acabamento' },
        update: {},
        create: {
          id: 'setor-acabamento',
          loja_id: loja.id,
          nome: 'Acabamento',
          descricao: 'Setor responsável pelo acabamento',
          cor: '#45B7D1',
          ativo: true,
          ordem: 3
        }
      })
    ]);

    console.log(`🏭 Criados ${setores.length} setores produtivos`);

    // Criar workflow de teste
    const workflow = await prisma.workflowOS.upsert({
      where: { id: 'workflow-teste' },
      update: {},
      create: {
        id: 'workflow-teste',
        loja_id: loja.id,
        nome: 'Workflow Teste',
        descricao: 'Workflow para testes do Kanban',
        etapas: JSON.stringify([
          { nome: 'Corte', ordem: 1, setor: 'Corte' },
          { nome: 'Impressão', ordem: 2, setor: 'Impressão' },
          { nome: 'Acabamento', ordem: 3, setor: 'Acabamento' }
        ]),
        ativo: true,
        sequencial: true
      }
    });

    console.log(`🔄 Criado workflow: ${workflow.nome}`);

    // Criar OSs de teste com diferentes status
    const osTeste = [
      {
        numero: 'OS-001',
        nome_servico: 'Banner Promocional',
        status: 'PRODUCAO',
        prioridade: 'ALTA',
        data_prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 dias
      },
      {
        numero: 'OS-002',
        nome_servico: 'Adesivo Vinil',
        status: 'FILA',
        prioridade: 'MEDIA',
        data_prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 dias
      },
      {
        numero: 'OS-003',
        nome_servico: 'Placa de Sinalização',
        status: 'ACABAMENTO',
        prioridade: 'CRITICA',
        data_prazo: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrasado
      },
      {
        numero: 'OS-004',
        nome_servico: 'Faixa de Evento',
        status: 'FINALIZADA',
        prioridade: 'BAIXA',
        data_prazo: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
      },
      {
        numero: 'OS-005',
        nome_servico: 'Display de Loja',
        status: 'AGUARDANDO_MATERIAL',
        prioridade: 'ALTA',
        data_prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
      }
    ];

    const osCriadas = [];
    for (const osData of osTeste) {
      const os = await prisma.ordemServico.upsert({
        where: { 
          loja_id_numero: {
            loja_id: loja.id,
            numero: osData.numero
          }
        },
        update: {},
        create: {
          numero: osData.numero,
          loja_id: loja.id,
          cliente_id: cliente.id,
          nome_servico: osData.nome_servico,
          descricao: `Descrição do serviço ${osData.nome_servico}`,
          quantidade: 1,
          status: osData.status,
          data_prazo: osData.data_prazo,
          responsavel_id: usuario.id,
          observacoes: `OS de teste para ${osData.nome_servico}`,
          materiais_disponivel: true
        }
      });
      osCriadas.push(os);
    }

    console.log(`📋 Criadas ${osCriadas.length} OSs de teste`);

    // Criar instâncias de workflow para algumas OSs
    for (let i = 0; i < 3; i++) {
      const os = osCriadas[i];
      const workflowInstancia = await prisma.workflowInstancia.upsert({
        where: { os_id: os.id },
        update: {},
        create: {
          os_id: os.id,
          workflow_id: workflow.id,
          status: 'ATIVO',
          etapa_atual: 'Corte'
        }
      });

      // Criar etapas da instância
      const etapas = [
        { nome: 'Corte', ordem: 1, status: 'EM_ANDAMENTO' },
        { nome: 'Impressão', ordem: 2, status: 'PENDENTE' },
        { nome: 'Acabamento', ordem: 3, status: 'PENDENTE' }
      ];

      for (const etapaData of etapas) {
        await prisma.etapaInstancia.create({
          data: {
            workflow_instancia_id: workflowInstancia.id,
            etapa_nome: etapaData.nome,
            ordem: etapaData.ordem,
            status: etapaData.status,
            responsavel_id: etapaData.status === 'EM_ANDAMENTO' ? usuario.id : null,
            tempo_estimado: 60
          }
        });
      }
    }

    console.log(`🔄 Criadas instâncias de workflow`);

    // Criar itens de OS
    for (const os of osCriadas) {
      await prisma.itemOS.upsert({
        where: { id: `item-${os.id}` },
        update: {},
        create: {
          id: `item-${os.id}`,
          os_id: os.id,
          produto_servico: os.nome_servico,
          quantidade: 1,
          status_liberacao_pcp: 'LIBERADO',
          prioridade_produto: 'NORMAL',
          ordem_producao: 1
        }
      });
    }

    console.log(`📦 Criados itens de OS`);

    console.log('✅ Seed de dados de teste concluído com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log(`- ${setores.length} setores produtivos`);
    console.log(`- 1 workflow`);
    console.log(`- ${osCriadas.length} OSs de teste`);
    console.log(`- 3 instâncias de workflow`);
    console.log(`- ${osCriadas.length} itens de OS`);
    console.log('\n🎯 Agora você pode testar o Kanban com dados reais!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
seedKanbanTest()
  .catch((error) => {
    console.error('❌ Falha no seed:', error);
    process.exit(1);
  });
