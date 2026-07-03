import Link from 'next/link';
import type { Metadata } from 'next';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { buildPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Termos de Serviço',
  description:
    'Regras de uso da plataforma Comunikapp: conta, conteúdo, disponibilidade e responsabilidades.',
  path: '/termos-de-servico',
});

const ATUALIZADO_EM = '3 de julho de 2026';
const EMAIL_CONTATO = 'contato@comunikapp.com';
const RAZAO_SOCIAL = 'C. E. DOS SANTOS CONSULTORIA EM TI';
const CNPJ = '35.644.522/0001-00';

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-neutral-900">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
        {children}
      </div>
    </section>
  );
}

export default function TermosDeServicoPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandLogo variant="logoFull" heightPx={36} />
        </Link>

        <h1 className="mt-10 text-3xl font-bold tracking-tight text-neutral-900">
          Termos de Serviço
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última atualização: {ATUALIZADO_EM}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-neutral-600">
          Estes Termos de Serviço regulam o uso da plataforma <strong>Comunikapp</strong>{' '}
          (&quot;plataforma&quot;, &quot;serviço&quot;), disponível em{' '}
          <a
            href="https://comunikapp.com.br"
            className="text-blue-600 underline underline-offset-2"
          >
            comunikapp.com.br
          </a>
          , operada por {RAZAO_SOCIAL}. Ao criar uma conta ou utilizar o
          serviço, você concorda com estes termos e com nossa{' '}
          <Link href="/politica-privacidade" className="text-blue-600 underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>

        <Secao titulo="1. Descrição do serviço">
          <p>
            O Comunikapp é um sistema de gestão (SaaS) voltado a empresas de
            comunicação visual, cobrindo orçamentos, produção, expedição,
            instalação, arte e financeiro. O serviço é organizado em módulos
            que podem ser habilitados conforme a necessidade de cada loja.
          </p>
        </Secao>

        <Secao titulo="2. Beta fechado">
          <p>
            O Comunikapp está atualmente em <strong>beta fechado</strong>,
            com acesso por convite. Nessa fase, funcionalidades podem mudar,
            ser ajustadas ou descontinuadas sem aviso prévio extenso, e não
            garantimos disponibilidade contínua (SLA) do serviço. Fazemos o
            possível para comunicar mudanças relevantes aos usuários do beta
            com antecedência razoável.
          </p>
        </Secao>

        <Secao titulo="3. Cadastro e conta">
          <p>
            Para usar a plataforma, é necessário criar uma conta com dados
            verdadeiros e atualizados. Você é responsável por manter a
            confidencialidade da sua senha e por todas as atividades
            realizadas na sua conta. Avise-nos imediatamente em caso de uso
            não autorizado.
          </p>
          <p>
            Cada conta pertence a uma loja/empresa. Os administradores da
            loja são responsáveis por conceder e revogar acesso de seus
            próprios usuários (colaboradores).
          </p>
        </Secao>

        <Secao titulo="4. Uso aceitável">
          <p>Ao usar o Comunikapp, você concorda em não:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Utilizar o serviço para fins ilícitos ou fraudulentos;</li>
            <li>
              Tentar acessar dados de outras lojas, contornar controles de
              acesso ou explorar vulnerabilidades do sistema;
            </li>
            <li>
              Sobrecarregar a infraestrutura de forma intencional (ex.:
              automações abusivas, scraping em massa);
            </li>
            <li>Reproduzir, revender ou sublicenciar a plataforma sem autorização.</li>
          </ul>
        </Secao>

        <Secao titulo="5. Conteúdo e dados inseridos por você">
          <p>
            Os dados que sua loja cadastra na plataforma (clientes,
            orçamentos, arquivos de arte, informações financeiras etc.)
            pertencem a você. Você nos concede uma licença limitada para
            armazenar, processar e exibir esses dados exclusivamente para
            operar o serviço em seu favor — não usamos seu conteúdo para
            outros fins. Detalhes sobre coleta e uso de dados estão na{' '}
            <Link href="/politica-privacidade" className="text-blue-600 underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
          <p>
            Você é responsável por garantir que tem o direito de inserir os
            dados e arquivos que cadastra na plataforma (ex.: artes e
            materiais de clientes).
          </p>
        </Secao>

        <Secao titulo="6. Propriedade intelectual">
          <p>
            A marca Comunikapp, o software, o design e a documentação da
            plataforma pertencem a {RAZAO_SOCIAL} e são protegidos por lei.
            Nada nestes termos transfere propriedade intelectual da
            plataforma para o usuário.
          </p>
        </Secao>

        <Secao titulo="7. Planos e pagamento">
          <p>
            Durante o período de beta fechado, o acesso é concedido nas
            condições combinadas no convite (gratuito ou com desconto,
            conforme o caso). Antes de qualquer cobrança regular, ou de
            mudança nas condições de uso, avisaremos os usuários com
            antecedência.
          </p>
        </Secao>

        <Secao titulo="8. Suspensão e encerramento">
          <p>
            Podemos suspender ou encerrar o acesso de uma conta em caso de
            uso indevido, violação destes termos, ou por solicitação do
            próprio usuário/loja. Você pode encerrar sua conta a qualquer
            momento entrando em contato conosco.
          </p>
          <p>
            Em caso de encerramento, seus dados são tratados conforme
            descrito na{' '}
            <Link href="/politica-privacidade" className="text-blue-600 underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </Secao>

        <Secao titulo="9. Limitação de responsabilidade">
          <p>
            O serviço é fornecido &quot;como está&quot;, especialmente durante
            o beta fechado. Na máxima extensão permitida por lei, não nos
            responsabilizamos por danos indiretos, lucros cessantes ou perda
            de dados decorrentes do uso do serviço, ressalvados os casos de
            dolo ou culpa grave de nossa parte.
          </p>
        </Secao>

        <Secao titulo="10. Alterações nestes termos">
          <p>
            Podemos atualizar estes Termos de Serviço periodicamente. A data
            no topo desta página indica a versão mais recente. Alterações
            relevantes serão comunicadas aos usuários.
          </p>
        </Secao>

        <Secao titulo="11. Lei aplicável e foro">
          <p>
            Estes termos são regidos pelas leis da República Federativa do
            Brasil. Fica eleito o foro do domicílio da {RAZAO_SOCIAL} para
            dirimir eventuais controvérsias, salvo disposição legal em
            contrário.
          </p>
        </Secao>

        <Secao titulo="12. Contato">
          <p>
            Dúvidas sobre estes Termos de Serviço podem ser enviadas para{' '}
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="text-blue-600 underline underline-offset-2"
            >
              {EMAIL_CONTATO}
            </a>
            .
          </p>
        </Secao>

        <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          <p>
            {RAZAO_SOCIAL} — CNPJ {CNPJ}
          </p>
          <p className="mt-1">
            <Link href="/" className="underline underline-offset-2">
              comunikapp.com.br
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
