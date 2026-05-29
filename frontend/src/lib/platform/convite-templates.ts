/** Mensagem curta 1:1 — depois de criar convite para um lead específico. */
export const CONVITE_INDIVIDUAL_WHATSAPP = `Olá, [NOME]! 👋

Você foi convidado(a) para testar o *Comunikapp* — plataforma de gestão para comunicação visual.

Crie sua loja pelo link exclusivo (válido só para o seu e-mail):
[LINK]

Após cadastrar, confirme o código enviado por e-mail e faça login em https://comunikapp.com.br

Estamos em fase de testes: feedbacks e reportes de bugs são muito bem-vindos.

Qualquer dúvida, estou à disposição!`;

/** Divulgação para grupos WhatsApp — chamar interessados; convite individual vem depois. */
export const GRUPO_WHATSAPP_DIVULGACAO = `Pessoal, estou abrindo *vagas para testar o Comunikapp* — plataforma online de gestão para empresas de *comunicação visual*.

*O que a plataforma oferece:*
📊 Dashboard operacional com KPIs e alertas
📋 Orçamentos com motor de cálculo, DXF, simulador e PDF para o cliente
👥 Clientes e histórico comercial
📦 Insumos integrados ao estoque (incl. fluxo 3D)
🏭 Estoque completo (lotes, transferências, sobras, relatórios)
📦 Produtos e templates de orçamento
📄 Ordens de Serviço e aprovação técnica
🎨 Arte & Aprovação com link para o cliente
💰 Financeiro (cobranças e recebimentos)
🏗️ PCP — kanban, workflows, apontamentos e visão por setor
⚙️ Centros de Trabalho — máquinas, funções e custos indiretos

*Programa de testes (beta):*
✅ Acesso por convite pessoal
✅ Quero ouvir *feedbacks*, sugestões e *reportes de bugs*
✅ Ajuda a moldar a ferramenta para a realidade da nossa área

*Interessado(a)?*
Me chame no *privado* ou envie *nome + e-mail* para [SEU_CONTATO].

Quem for selecionado recebe um convite exclusivo para criar a loja e começar a testar.

🌐 https://comunikapp.com.br`;

export function renderConviteIndividualWhatsapp(
  template: string,
  params: { nome: string; link: string },
) {
  const nome = params.nome.trim() || 'convidado(a)';
  const link = params.link.trim();

  return template.replace(/\[NOME\]/g, nome).replace(/\[LINK\]/g, link).trim();
}
