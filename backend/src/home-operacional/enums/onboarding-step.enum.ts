// IDs estaveis das etapas do onboarding operacional.
// NUNCA renomear; se necessario, depreciar e criar novo.
// Ver docs/fase-0-home-operacional/03-onboarding-etapas.md
export enum OnboardingStepId {
  DADOS_EMPRESA = 'dados_empresa',
  PRIMEIRO_CLIENTE = 'primeiro_cliente',
  PRIMEIRO_MATERIAL = 'primeiro_material',
  PRIMEIRA_MAQUINA = 'primeira_maquina',
  CONFIGURAR_PRODUCAO = 'configurar_producao',
  CONFIGURAR_ENTREGA_INSTALACAO = 'configurar_entrega_instalacao',
  CONFIGURAR_ARTE_APROVACAO = 'configurar_arte_aprovacao',
  MARGEM_IMPOSTO = 'margem_imposto',
  CONDICAO_PAGAMENTO = 'condicao_pagamento',
  PRIMEIRO_ORCAMENTO = 'primeiro_orcamento',
  PRIMEIRA_APROVACAO = 'primeira_aprovacao',
  PRIMEIRA_PRODUCAO = 'primeira_producao',
  PRIMEIRO_RECEBIMENTO = 'primeiro_recebimento',
}
