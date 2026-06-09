import { OnboardingEtapaCatalogo } from '../interfaces/onboarding.interface';
import { OnboardingStepId } from '../enums/onboarding-step.enum';

/**
 * Catalogo oficial das etapas de onboarding.
 * Mudar este catalogo significa mudar a experiencia de implantacao para
 * todas as lojas; revisar com produto antes de alterar.
 *
 * Detalhamento e criterios de deteccao automatica em
 * docs/fase-0-home-operacional/03-onboarding-etapas.md
 */
export const ONBOARDING_ETAPAS_CATALOGO: ReadonlyArray<OnboardingEtapaCatalogo> = [
  {
    step_id: OnboardingStepId.DADOS_EMPRESA,
    ordem: 1,
    obrigatoria: true,
    titulo: 'Confirmar dados da empresa',
    descricao_curta: 'Preencha nome, documento e contato. Esses dados aparecem nos seus orçamentos.',
    acao_label: 'Abrir configurações da loja',
    acao_href: '/configuracoes/loja',
  },
  {
    step_id: OnboardingStepId.PRIMEIRO_CLIENTE,
    ordem: 2,
    obrigatoria: true,
    titulo: 'Cadastrar primeiro cliente',
    descricao_curta: 'Quem vai comprar do seu negócio.',
    acao_label: 'Cadastrar cliente',
    acao_href: '/clientes/novo',
  },
  {
    step_id: OnboardingStepId.PRIMEIRO_MATERIAL,
    ordem: 3,
    obrigatoria: true,
    titulo: 'Cadastrar materiais principais',
    descricao_curta: 'Sem material cadastrado, o orçamento não consegue calcular custo nem consumo.',
    acao_label: 'Cadastrar material',
    acao_href: '/insumos/novo',
  },
  {
    step_id: OnboardingStepId.PRIMEIRA_MAQUINA,
    ordem: 4,
    obrigatoria: true,
    titulo: 'Cadastrar máquinas ou processos',
    descricao_curta: 'Pode ser uma máquina (CNC, router, laser) ou um serviço manual.',
    acao_label: 'Cadastrar máquina',
    acao_href: '/centros-de-trabalho/maquinas/novo',
  },
  {
    step_id: OnboardingStepId.CONFIGURAR_PRODUCAO,
    ordem: 5,
    obrigatoria: true,
    titulo: 'Definir como o PCP vai funcionar',
    descricao_curta: 'Escolha entre PCP essencial, organizado ou completo conforme o tamanho da operação.',
    acao_label: 'Definir PCP',
    acao_href: '/pcp/configuracao',
  },
  {
    step_id: OnboardingStepId.CONFIGURAR_ENTREGA_INSTALACAO,
    ordem: 6,
    obrigatoria: false,
    titulo: 'Configurar entrega e instalação',
    descricao_curta: 'Crie modalidades de entrega e tipos de instalação para orientar o orçamento sem complicar a operação.',
    acao_label: 'Abrir Centros de Trabalho',
    acao_href: '/centros-de-trabalho',
  },
  {
    step_id: OnboardingStepId.MARGEM_IMPOSTO,
    ordem: 7,
    obrigatoria: true,
    titulo: 'Definir margem e impostos',
    descricao_curta: 'Sem isso, todo orçamento parte do zero. Você pode usar nossa configuração recomendada.',
    acao_label: 'Configurar margem e impostos',
    acao_href: '/configuracoes/loja',
  },
  {
    step_id: OnboardingStepId.CONDICAO_PAGAMENTO,
    ordem: 8,
    obrigatoria: false,
    titulo: 'Configurar condição de pagamento padrão',
    descricao_curta: 'Ex.: 50% na assinatura, 50% na entrega. Vira sugestão automática nos orçamentos.',
    acao_label: 'Configurar pagamento padrão',
    acao_href: '/configuracoes/loja',
  },
  {
    step_id: OnboardingStepId.PRIMEIRO_ORCAMENTO,
    ordem: 9,
    obrigatoria: true,
    titulo: 'Criar primeiro orçamento',
    descricao_curta: 'Coloque tudo em prática gerando uma proposta real.',
    acao_label: 'Novo orçamento',
    acao_href: '/orcamentos-v2/novo',
  },
  {
    step_id: OnboardingStepId.PRIMEIRA_APROVACAO,
    ordem: 10,
    obrigatoria: true,
    titulo: 'Aprovar orçamento e gerar OS',
    descricao_curta: 'Quando o cliente aceita, o orçamento vira ordem de serviço.',
    acao_label: 'Ver orçamentos',
    acao_href: '/orcamentos-v2',
  },
  {
    step_id: OnboardingStepId.PRIMEIRA_PRODUCAO,
    ordem: 11,
    obrigatoria: false,
    titulo: 'Liberar OS para produção',
    descricao_curta: 'Acompanhe a produção pelo PCP.',
    acao_label: 'Ver OS',
    acao_href: '/os',
  },
  {
    step_id: OnboardingStepId.PRIMEIRO_RECEBIMENTO,
    ordem: 12,
    obrigatoria: false,
    titulo: 'Registrar primeiro recebimento',
    descricao_curta: 'Marque entrada e saldo recebidos para acompanhar seu caixa.',
    acao_label: 'Abrir financeiro',
    acao_href: '/financeiro/recebimentos',
  },
];
