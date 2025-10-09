/**
 * Script para popular regras de validação iniciais
 * Baseado em: RESUMO-MELHORIAS-OS-PCP-2025.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedValidacoesIniciais() {
  console.log('🌱 Populando regras de validação iniciais...\n');

  try {
    // Buscar uma loja para associar as regras (ou deixar null para regras globais)
    const loja = await prisma.loja.findFirst();
    
    const regras = [
      // ========================================
      // REGRAS DE ESTOQUE
      // ========================================
      {
        nome: 'Validação de Estoque Disponível',
        descricao: 'Verifica se há estoque suficiente de todos os materiais necessários para a OS',
        tipo: 'VALIDACAO',
        categoria: 'ESTOQUE',
        ativo: true,
        prioridade: 1,
        loja_id: null, // Regra global
        condicoes: {
          campo: 'materiais_disponivel',
          operador: 'equals',
          valor: false,
          mensagem_erro: 'Estoque insuficiente para um ou mais materiais',
          mensagem_alerta: 'Verifique a disponibilidade de materiais no estoque'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'AGUARDANDO_MATERIAL',
          notificar: ['admin', 'gerente', 'compras'],
          parametros: { criar_requisicao_compra: true },
          delay: 0
        }
      },
      {
        nome: 'Alerta de Estoque Baixo',
        descricao: 'Alerta quando o estoque está abaixo do mínimo, mas ainda disponível',
        tipo: 'ALERTA',
        categoria: 'ESTOQUE',
        ativo: true,
        prioridade: 2,
        loja_id: null,
        condicoes: {
          campo: 'quantidade_disponivel',
          operador: 'less_than',
          valor: 'estoque_minimo * 1.5',
          mensagem_alerta: 'Estoque baixo - considere reposição',
          expressao: 'quantidade_disponivel < (estoque_minimo * 1.5)'
        },
        acoes: {
          tipo: 'alertar',
          notificar: ['compras', 'gerente'],
          parametros: { sugerir_compra: true },
          delay: 0
        }
      },

      // ========================================
      // REGRAS DE ARTE
      // ========================================
      {
        nome: 'Validação de Arte Aprovada',
        descricao: 'Verifica se a arte foi aprovada antes de iniciar produção',
        tipo: 'VALIDACAO',
        categoria: 'ARTE',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'status_arte',
          operador: 'not_equals',
          valor: 'APROVADA',
          mensagem_erro: 'Arte não aprovada - necessária aprovação antes de iniciar produção',
          mensagem_alerta: 'Aguardando aprovação de arte'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'AGUARDANDO_ARTE',
          notificar: ['design', 'cliente', 'comercial'],
          parametros: { enviar_lembrete_cliente: true },
          delay: 0
        }
      },
      {
        nome: 'Alerta de Arte Pendente',
        descricao: 'Alerta quando a arte está há mais de 24h sem aprovação',
        tipo: 'ALERTA',
        categoria: 'ARTE',
        ativo: true,
        prioridade: 2,
        loja_id: null,
        condicoes: {
          campo: 'tempo_desde_envio_arte',
          operador: 'greater_than',
          valor: 24,
          mensagem_alerta: 'Arte pendente de aprovação há mais de 24 horas',
          expressao: 'tempo_desde_envio_arte > 24'
        },
        acoes: {
          tipo: 'notificar',
          notificar: ['comercial', 'gerente'],
          parametros: { 
            enviar_lembrete: true,
            prioridade: 'alta'
          },
          delay: 0
        }
      },

      // ========================================
      // REGRAS DE DADOS
      // ========================================
      {
        nome: 'Validação de Dados Obrigatórios',
        descricao: 'Verifica se todos os dados obrigatórios da OS foram preenchidos',
        tipo: 'VALIDACAO',
        categoria: 'DADOS',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'dados_completos',
          operador: 'equals',
          valor: false,
          mensagem_erro: 'Dados obrigatórios não preenchidos',
          mensagem_alerta: 'Complete todos os campos obrigatórios'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'PENDENTE_DADOS',
          notificar: ['comercial', 'responsavel'],
          parametros: { campos_faltantes: [] },
          delay: 0
        }
      },

      // ========================================
      // REGRAS DE PRAZO
      // ========================================
      {
        nome: 'Alerta de Prazo Apertado',
        descricao: 'Alerta quando o prazo de entrega é muito curto',
        tipo: 'ALERTA',
        categoria: 'PRAZO',
        ativo: true,
        prioridade: 2,
        loja_id: null,
        condicoes: {
          campo: 'dias_ate_entrega',
          operador: 'less_than',
          valor: 3,
          mensagem_alerta: 'Prazo de entrega muito curto - verificar viabilidade',
          expressao: 'dias_ate_entrega < 3'
        },
        acoes: {
          tipo: 'alertar',
          notificar: ['producao', 'gerente', 'comercial'],
          parametros: { 
            solicitar_confirmacao: true,
            prioridade: 'urgente'
          },
          delay: 0
        }
      },
      {
        nome: 'Validação de Prazo Expirado',
        descricao: 'Bloqueia OS quando o prazo já foi ultrapassado',
        tipo: 'VALIDACAO',
        categoria: 'PRAZO',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'data_prazo',
          operador: 'less_than',
          valor: 'now()',
          mensagem_erro: 'Prazo de entrega já expirado',
          expressao: 'data_prazo < now()'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'PRAZO_EXPIRADO',
          notificar: ['gerente', 'comercial', 'cliente'],
          parametros: { renegociar_prazo: true },
          delay: 0
        }
      },

      // ========================================
      // REGRAS TÉCNICAS
      // ========================================
      {
        nome: 'Validação de Especificações Técnicas',
        descricao: 'Verifica se as especificações técnicas estão completas',
        tipo: 'VALIDACAO',
        categoria: 'TECNICO',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'especificacoes_tecnicas_completas',
          operador: 'equals',
          valor: false,
          mensagem_erro: 'Especificações técnicas incompletas',
          mensagem_alerta: 'Complete as especificações técnicas do produto'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'PENDENTE_ESPECIFICACOES',
          notificar: ['tecnico', 'comercial'],
          parametros: { campos_tecnicos_faltantes: [] },
          delay: 0
        }
      },

      // ========================================
      // REGRAS COMERCIAIS
      // ========================================
      {
        nome: 'Validação de Aprovação Comercial',
        descricao: 'Verifica se o orçamento foi aprovado comercialmente',
        tipo: 'VALIDACAO',
        categoria: 'COMERCIAL',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'orcamento.status_aprovacao',
          operador: 'not_equals',
          valor: 'APROVADO',
          mensagem_erro: 'Orçamento não aprovado comercialmente',
          mensagem_alerta: 'Aguardando aprovação comercial do orçamento'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'AGUARDANDO_APROVACAO_COMERCIAL',
          notificar: ['comercial', 'gerente'],
          parametros: { enviar_lembrete: true },
          delay: 0
        }
      },
      {
        nome: 'Alerta de Desconto Alto',
        descricao: 'Alerta quando o desconto aplicado é maior que o limite permitido',
        tipo: 'ALERTA',
        categoria: 'COMERCIAL',
        ativo: true,
        prioridade: 2,
        loja_id: null,
        condicoes: {
          campo: 'percentual_desconto',
          operador: 'greater_than',
          valor: 15,
          mensagem_alerta: 'Desconto superior ao limite padrão - requer aprovação gerencial',
          expressao: 'percentual_desconto > 15'
        },
        acoes: {
          tipo: 'notificar',
          notificar: ['gerente', 'comercial', 'financeiro'],
          parametros: { 
            solicitar_aprovacao_gerencial: true,
            motivo_desconto: true
          },
          delay: 0
        }
      },

      // ========================================
      // REGRAS FINANCEIRAS
      // ========================================
      {
        nome: 'Validação de Cliente Inadimplente',
        descricao: 'Verifica se o cliente possui pendências financeiras',
        tipo: 'VALIDACAO',
        categoria: 'FINANCEIRO',
        ativo: true,
        prioridade: 1,
        loja_id: null,
        condicoes: {
          campo: 'cliente.status_financeiro',
          operador: 'equals',
          valor: 'INADIMPLENTE',
          mensagem_erro: 'Cliente com pendências financeiras - pagamento necessário antes de prosseguir',
          mensagem_alerta: 'Cliente possui débitos em aberto'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'BLOQUEADA_FINANCEIRO',
          notificar: ['financeiro', 'comercial', 'gerente'],
          parametros: { 
            exibir_debitos: true,
            bloquear_novos_pedidos: true
          },
          delay: 0
        }
      }
    ];

    console.log(`📝 Criando ${regras.length} regras de validação...\n`);

    let contador = 0;
    for (const regra of regras) {
      const criada = await prisma.regraValidacao.create({
        data: {
          ...regra,
          tipo: regra.tipo as any,
          categoria: regra.categoria as any,
          condicoes: regra.condicoes as any,
          acoes: regra.acoes as any,
          criado_por: 'seed-script',
          atualizado_por: 'seed-script'
        }
      });
      
      contador++;
      console.log(`✅ ${contador}. ${criada.nome} (${criada.categoria})`);
    }

    console.log(`\n🎉 ${contador} regras criadas com sucesso!`);
    
    // Estatísticas
    const stats = await prisma.regraValidacao.groupBy({
      by: ['categoria'],
      _count: { id: true }
    });

    console.log('\n📊 Estatísticas:');
    stats.forEach(stat => {
      console.log(`   - ${stat.categoria}: ${stat._count.id} regras`);
    });

  } catch (error) {
    console.error('❌ Erro ao popular regras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedValidacoesIniciais();







