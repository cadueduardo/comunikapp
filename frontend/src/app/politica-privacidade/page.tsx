import Link from 'next/link';
import type { Metadata } from 'next';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { buildPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Política de Privacidade',
  description:
    'Como o Comunikapp coleta, usa, armazena e protege os dados de usuários e lojas na plataforma.',
  path: '/politica-privacidade',
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

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2">
          <BrandLogo variant="logoFull" heightPx={36} />
        </Link>

        <h1 className="mt-10 text-3xl font-bold tracking-tight text-neutral-900">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última atualização: {ATUALIZADO_EM}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-neutral-600">
          Esta Política de Privacidade descreve como o <strong>Comunikapp</strong>{' '}
          (&quot;nós&quot;, &quot;plataforma&quot;) coleta, usa, armazena e protege
          informações de quem utiliza nosso sistema de gestão para empresas de
          comunicação visual, disponível em{' '}
          <a
            href="https://comunikapp.com.br"
            className="text-blue-600 underline underline-offset-2"
          >
            comunikapp.com.br
          </a>
          . Ao criar uma conta ou usar a plataforma, você concorda com os termos
          descritos abaixo.
        </p>

        <Secao titulo="1. Quem somos">
          <p>
            O Comunikapp é operado por {RAZAO_SOCIAL}, inscrita no CNPJ{' '}
            {CNPJ}, responsável pelo tratamento dos dados descritos nesta
            política.
          </p>
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <p>
            <strong>Dados de cadastro:</strong> nome, e-mail, telefone e dados
            da loja/empresa informados no momento do cadastro ou convite de
            usuário.
          </p>
          <p>
            <strong>Dados operacionais inseridos por você:</strong>{' '}
            informações que sua equipe cadastra na plataforma para operar o
            negócio, como dados de clientes, orçamentos, ordens de serviço,
            produção, estoque e financeiro. Esses dados pertencem à loja que os
            cadastrou e são usados exclusivamente para fornecer as
            funcionalidades do sistema a ela.
          </p>
          <p>
            <strong>Dados técnicos:</strong> endereço IP, tipo de navegador,
            páginas acessadas e registros de erro, coletados automaticamente
            para garantir segurança, estabilidade e diagnóstico de falhas
            (utilizamos o Sentry para monitoramento de erros da aplicação).
          </p>
          <p>
            <strong>Cookies e sessão:</strong> usamos cookies estritamente
            necessários para manter sua sessão autenticada e, quando
            aplicável, um captcha (Cloudflare Turnstile) para prevenir abuso em
            formulários públicos.
          </p>
        </Secao>

        <Secao titulo="3. Uso de login e integrações com o Google (OAuth)">
          <p>
            O Comunikapp <strong>não usa</strong> o Google para autenticação
            de login. A única integração com contas Google é{' '}
            <strong>opcional</strong> e feita pelo próprio usuário em{' '}
            <em>Configurações → Conexões</em>, para conectar o Google Drive da
            loja e organizar automaticamente arquivos gerados no fluxo de
            aprovação de arte.
          </p>
          <p>Quando você autoriza essa conexão, solicitamos ao Google apenas:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code className="text-xs">drive.file</code> — acesso somente aos
              arquivos e pastas que o próprio Comunikapp cria dentro do seu
              Google Drive (uma pasta &quot;Comunikapp&quot;). Não lemos,
              listamos ou alteramos outros arquivos existentes na sua conta.
            </li>
            <li>
              <code className="text-xs">drive.metadata.readonly</code> —
              leitura de metadados (como nome e organização de pastas) apenas
              para exibir corretamente a estrutura de arquivos criada pelo
              app.
            </li>
            <li>
              <code className="text-xs">userinfo.email</code> e{' '}
              <code className="text-xs">userinfo.profile</code> — identificar
              qual conta Google foi conectada.
            </li>
          </ul>
          <p>
            O token de acesso é armazenado de forma segura e usado apenas para
            criar e organizar os arquivos da própria loja no Drive dela. Você
            pode revogar essa conexão a qualquer momento pela própria
            plataforma (em <em>Configurações → Conexões</em>) ou diretamente em{' '}
            <a
              href="https://myaccount.google.com/permissions"
              className="text-blue-600 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              myaccount.google.com/permissions
            </a>
            . O uso dessas informações segue as{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="text-blue-600 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , incluindo os requisitos de Uso Limitado (Limited Use).
          </p>
        </Secao>

        <Secao titulo="4. Como usamos os dados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Fornecer, manter e melhorar as funcionalidades da plataforma;</li>
            <li>Autenticar usuários e manter a segurança das contas;</li>
            <li>
              Enviar comunicações operacionais (confirmações, convites,
              notificações do sistema) por e-mail;
            </li>
            <li>Prevenir fraude, abuso e uso indevido da plataforma;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
          <p>Não vendemos dados pessoais a terceiros.</p>
        </Secao>

        <Secao titulo="5. Compartilhamento com terceiros">
          <p>
            Compartilhamos dados apenas com prestadores de serviço que nos
            ajudam a operar a plataforma, sob obrigação contratual de
            confidencialidade e segurança:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Infraestrutura de hospedagem e banco de dados;</li>
            <li>Provedor de e-mail (SMTP) para envio de notificações;</li>
            <li>Sentry, para monitoramento e diagnóstico de erros técnicos;</li>
            <li>
              Google, exclusivamente quando você conecta o Google Drive da sua
              loja (item 3);
            </li>
            <li>Cloudflare Turnstile, para proteção anti-abuso em formulários.</li>
          </ul>
        </Secao>

        <Secao titulo="6. Armazenamento e segurança">
          <p>
            Os dados são armazenados em ambiente com controle de acesso,
            criptografia em trânsito (HTTPS) e segregação por loja/conta. O
            acesso interno é restrito a pessoas autorizadas e necessário para
            suporte e manutenção do serviço.
          </p>
        </Secao>

        <Secao titulo="7. Retenção de dados">
          <p>
            Mantemos os dados enquanto sua conta estiver ativa ou pelo tempo
            necessário para cumprir obrigações legais, fiscais ou regulatórias.
            Ao solicitar o encerramento da conta, os dados podem ser
            anonimizados ou excluídos, ressalvadas as hipóteses de guarda
            obrigatória previstas em lei.
          </p>
        </Secao>

        <Secao titulo="8. Seus direitos (LGPD)">
          <p>
            Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
            você pode solicitar a qualquer momento:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação e acesso aos dados que temos sobre você;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Portabilidade dos dados a outro fornecedor;</li>
            <li>Revogação do consentimento e exclusão de dados tratados com base nele;</li>
            <li>Informação sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Para exercer esses direitos, entre em contato pelo e-mail{' '}
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="text-blue-600 underline underline-offset-2"
            >
              {EMAIL_CONTATO}
            </a>
            .
          </p>
        </Secao>

        <Secao titulo="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente para refletir
            mudanças legais ou na plataforma. A data no topo desta página
            indica a versão mais recente. Alterações relevantes serão
            comunicadas aos usuários.
          </p>
        </Secao>

        <Secao titulo="10. Contato">
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados
            podem ser enviadas para{' '}
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
