"use client";
import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { Briefcase, Component, PenTool } from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check } from "lucide-react";
import Header from "@/components/header";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white antialiased">
      <Header />
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center space-y-12 pt-28">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50 leading-tight">
            Gestão Simplificada.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-400 to-purple-500">
              Resultados Visíveis.
            </span>
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-neutral-300">
            A plataforma modular para sua empresa de comunicação visual crescer. Otimize orçamentos, produção e finanças em um só lugar.
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 py-6 text-base font-semibold">
            Inicie seu teste gratuito de 30 dias
          </Button>
        </div>

        {/* Modules Section */}
        <div className="w-full max-w-5xl py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
            Módulos Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ModuleCard
              icon={<PenTool className="w-8 h-8 text-blue-400" />}
              title="Orçamentos em Segundos"
              description="Crie propostas precisas e profissionais em tempo recorde com nosso motor de cálculo inteligente."
            />
            <ModuleCard
              icon={<Briefcase className="w-8 h-8 text-purple-400" />}
              title="Produção sem Caos"
              description="Transforme orçamentos aprovados em Ordens de Serviço claras e controle cada etapa da sua produção."
            />
            <ModuleCard
              icon={<Component className="w-8 h-8 text-green-400" />}
              title="Sua Loja, Suas Regras"
              description="Com nosso marketplace, você instala e paga apenas pelos módulos que realmente precisa."
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="modulos" className="w-full max-w-5xl py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
            O que nossos clientes dizem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="O Comunikapp transformou nossa gestão. Os orçamentos que levavam horas agora saem em minutos. Essencial para qualquer empresa de comunicação visual."
              name="Ana Silva"
              title="Diretora, Art Placas"
              avatar="AS"
            />
            <TestimonialCard
              quote="Finalmente um sistema que entende nosso fluxo de produção. O controle de etapas é visual e muito intuitivo. Recomendo!"
              name="Marcos Rocha"
              title="Gerente de Produção, Print Express"
              avatar="MR"
            />
            <TestimonialCard
              quote="A modularidade é o grande diferencial. Começamos com o básico e fomos adicionando módulos conforme a necessidade. Custo-benefício imbatível."
              name="Carla Mendes"
              title="CEO, Letra Visual"
              avatar="CM"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full max-w-3xl py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <FaqItem
              value="item-1"
              question="O que é o Comunikapp?"
              answer="É uma plataforma SaaS (Software como Serviço) completa e modular para empresas de comunicação visual. Nosso objetivo é simplificar a gestão, desde o orçamento até a produção e o financeiro, através de módulos que você pode instalar conforme sua necessidade."
            />
            <FaqItem
              value="item-2"
              question="Como funciona o período de teste gratuito?"
              answer="Você pode experimentar o Comunikapp com todos os módulos disponíveis por 30 dias, sem compromisso. Não pedimos cartão de crédito para iniciar o teste. Ao final do período, você pode escolher os módulos que deseja assinar."
            />
            <FaqItem
              value="item-3"
              question="Meus dados estão seguros?"
              answer="Sim. Segurança é nossa prioridade. Usamos uma arquitetura multi-tenant com isolamento de dados por loja, garantindo que apenas usuários autorizados da sua empresa tenham acesso às suas informações."
            />
             <FaqItem
              value="item-4"
              question="Posso cancelar minha assinatura a qualquer momento?"
              answer="Sim. A assinatura dos módulos é mensal e você pode cancelar ou alterar seu plano quando quiser, sem taxas ou multas. A gestão é flexível para se adaptar ao crescimento da sua empresa."
            />
          </Accordion>
        </div>

        {/* Pricing Section */}
        <div id="precos" className="w-full max-w-6xl py-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-4">
                Planos flexíveis para sua empresa
            </h2>
            <p className="text-lg text-neutral-400 text-center mb-12 max-w-2xl mx-auto">
                Comece com o essencial e adicione módulos conforme você cresce. Sem contratos de longo prazo.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <PricingCard
                    plan="Essencial"
                    price="R$ 99"
                    description="Para freelancers e pequenas empresas começando."
                    features={[
                        "Módulo de Orçamento",
                        "Módulo de Produção (Básico)",
                        "1 Usuário",
                        "Suporte por E-mail"
                    ]}
                />
                <PricingCard
                    plan="Profissional"
                    price="R$ 249"
                    description="Para empresas em crescimento que precisam de mais automação."
                    features={[
                        "Tudo do Essencial, e mais:",
                        "Módulo Financeiro",
                        "Módulo de Estoque",
                        "Até 5 Usuários",
                        "Suporte Prioritário"
                    ]}
                    isPopular={true}
          />
                <PricingCard
                    plan="Enterprise"
                    price="Customizado"
                    description="Para grandes operações com necessidades específicas."
                    features={[
                        "Tudo do Profissional, e mais:",
                        "Módulos Customizados",
                        "Usuários Ilimitados",
                        "Gerente de Conta Dedicado",
                        "SLA de Uptime"
                    ]}
                />
            </div>
        </div>

      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm text-neutral-500 relative z-10">
        <p>© 2025 Comunikapp. Todos os direitos reservados.</p>
      </footer>

      <BackgroundBeams />
    </main>
  );
}

const ModuleCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-neutral-900/50 border border-white/[0.1] rounded-2xl p-6 flex flex-col items-start space-y-4 relative overflow-hidden group hover:border-purple-500/50 transition-colors duration-300">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="bg-neutral-800/80 p-3 rounded-lg z-10">
        {icon}
      </div>
      <div className="z-10">
        <h3 className="text-xl font-bold text-neutral-100">{title}</h3>
        <p className="text-neutral-400 mt-2">{description}</p>
      </div>
    </div>
  );
};

const TestimonialCard = ({ quote, name, title, avatar }: { quote: string; name: string; title: string; avatar: string }) => {
  return (
    <div className="bg-neutral-900/50 border border-white/[0.1] rounded-2xl p-6 flex flex-col justify-between">
      <p className="text-neutral-300 italic">{quote}</p>
      <div className="flex items-center mt-4">
        <Image
          src={`https://placehold.co/40x40/222/FFF/png?text=${avatar}`}
          alt={name}
          width={40}
          height={40}
          className="rounded-full"
          style={{ height: "auto" }}
        />
        <div className="ml-4">
          <p className="font-bold text-neutral-100">{name}</p>
          <p className="text-sm text-neutral-400">{title}</p>
        </div>
      </div>
    </div>
  );
};

const FaqItem = ({ value, question, answer }: { value: string; question: string; answer: string; }) => (
  <AccordionItem value={value} className="border-b border-neutral-700">
    <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
      {question}
    </AccordionTrigger>
    <AccordionContent className="text-base text-neutral-300">
      {answer}
    </AccordionContent>
  </AccordionItem>
);

const PricingCard = ({ plan, price, description, features, isPopular = false }: { plan: string; price: string; description: string; features: string[]; isPopular?: boolean; }) => (
    <div className={`relative rounded-2xl p-8 border ${isPopular ? 'border-purple-500' : 'border-neutral-700'}`}>
        {isPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    MAIS POPULAR
                </span>
            </div>
        )}
        <h3 className="text-2xl font-bold">{plan}</h3>
        <p className="text-neutral-400 mt-2">{description}</p>
        <div className="mt-6">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-neutral-400">/mês</span>
        </div>
        <ul className="mt-6 space-y-4">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Button className={`w-full mt-8 text-base py-6 ${isPopular ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white text-black hover:bg-neutral-200'}`}>
            Começar Agora
        </Button>
    </div>
);
