# Pilha Tecnológica do Projeto Comunikapp

Este documento descreve a pilha de tecnologias (tech stack) escolhida para o desenvolvimento do Comunikapp. A seleção foi feita com base nos princípios de modularidade, escalabilidade, experiência do desenvolvedor e uma rica experiência do usuário final.

## Arquitetura Geral

A arquitetura do sistema é baseada em uma abordagem de serviços modulares, com um frontend desacoplado. Um **API Gateway** centraliza a comunicação, garantindo segurança e organização. Esta arquitetura foi projetada para ser robusta e permitir a adição de novas funcionalidades complexas no futuro (como módulos de IA) de forma segura e isolada.

---

## Frontend

| Área | Tecnologia Proposta | Justificativa |
| :--- | :--- | :--- |
| **Framework Principal** | **Next.js** | Framework React moderno, ideal para a Landing Page (otimizado para SEO) e para a aplicação web complexa. |
| **Aplicação Web** | **PWA (Progressive Web App)** | Permite que a aplicação seja "instalável" em desktops e celulares, com funcionalidades offline, via `next-pwa`. |
| **Estilização** | **Tailwind CSS** | Abordagem "utility-first" que permite a criação de designs customizados, responsivos e com suporte nativo a dark mode. |
| **Componentes de Base** | **shadcn/ui** | Coleção de componentes acessíveis e bem construídos que servem como a base sólida para a UI (formulários, tabelas, modais). |
| **Componentes Visuais** | **Aceternity UI & Magic UI**| Usados para criar o "fator uau" na Landing Page e em elementos de dashboard, com animações e visuais de alto impacto. |

---

## Backend

| Área | Tecnologia Proposta | Justificativa |
| :--- | :--- | :--- |
| **Framework** | **NestJS (TypeScript)** | Framework Node.js projetado para modularidade e escalabilidade. O uso de TypeScript unifica a linguagem com o frontend. |
| **Banco de Dados** | **MySQL** | Banco de dados relacional robusto, confiável e amplamente adotado no mercado. |
| **Comunicação com BD (ORM)** | **Prisma** | ORM moderno e type-safe que acelera e torna mais segura a interação com o banco de dados a partir do NestJS. |
| **Autenticação** | **JWT (JSON Web Tokens)** | Padrão de mercado para proteger as APIs, garantindo que todas as requisições sejam autenticadas e autorizadas. | 