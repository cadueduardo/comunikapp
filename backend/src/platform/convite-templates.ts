export const CONVITE_INDIVIDUAL_WHATSAPP = `Olá, [NOME]! 👋

Você foi convidado(a) para testar o *Comunikapp* — plataforma de gestão para comunicação visual.

Crie sua loja pelo link exclusivo (válido só para o seu e-mail):
[LINK]

Após cadastrar, confirme o código enviado por e-mail e faça login em https://comunikapp.com.br

Estamos em fase de testes: feedbacks e reportes de bugs são muito bem-vindos.

Qualquer dúvida, estou à disposição!`;

export function renderConviteIndividualWhatsapp(
  template: string,
  params: { nome: string; link: string },
) {
  const nome = params.nome.trim() || 'convidado(a)';
  const link = params.link.trim();

  return template.replace(/\[NOME\]/g, nome).replace(/\[LINK\]/g, link).trim();
}
