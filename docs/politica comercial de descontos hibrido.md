<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# em Observações Adicionais, não precisa da internacionalização.

Deixar claro que precisa ser um módulo/api totalmente apartado para que possa ser instalavel para quando o cliente quiser esse recurso na sua loja (através de marketplace que será desenvolvido futuramente).

Segue o PBI revisado conforme sua orientação, atuando como Product Owner e Analista de Sistemas:

# PBI – Módulo Instalável: Política Comercial de Descontos Híbrida

**Papel:** Product Owner / Analista de Sistemas

## Objetivo do Módulo

Desenvolver um módulo/API **totalmente apartado** para Política Comercial de Descontos, possibilitando a instalação/desinstalação independente via marketplace interno da plataforma. O módulo permitirá ao lojista criar, editar e gerenciar múltiplas tabelas de desconto ― híbridas para quantidade unitária e metragem quadrada ―, garantindo flexibilidade comercial e automação no motor de cálculo de orçamentos[^3][^6].

## Regras de Negócio

- O módulo deve ser **autônomo e plugável**, instalável apenas nas lojas que adquirirem/configurarem o recurso.
- O administrador pode criar uma ou mais **tabelas de política comercial de desconto** (ex: Tabela Convencional, Tabela Shock, Tabela Promo Black Friday).
- Cada tabela suporta regras múltiplas, associadas por tipo de unidade (unidade, m², litro, etc.).
- Para cada regra:
    - Definir unidade de venda (ex: unidade, m²)
    - Definir faixa inicial e final (ex: de 10 a 49 unidades, de 2 a 10m²)
    - Definir percentual ou valor fixo de desconto (um dos dois deve ser preenchido)
    - Associar a produtos, grupos ou categorias específicas (quando desejado)
    - Definir vigência (datas de início/fim, opcional)
    - Regras não se sobrepõem dentro da mesma tabela e unidade de venda
- No orçamento, o usuário pode escolher qual tabela de desconto aplicar; o motor consulta a configuração e aplica a lógica híbrida (por unidade ou metragem) automaticamente por item do orçamento.
- Qualquer ação de ativação, inativação, edição ou exclusão respeita integridade de dados e rastreabilidade.
- Não aceite internacionalização (idioma/moeda únicos).
- Logs detalhados para todas as alterações, para compliance e auditoria.


## Estrutura dos Campos

### Tabela de Política Comercial de Desconto

| Campo | Obrigatório | Tipo de Componente | Validação | Observações |
| :-- | :--: | :-- | :-- | :-- |
| Nome da Tabela | Sim | Input text | Único, min. 3 caracteres | Nome identificador |
| Ativa/Inativa | Sim | Checkbox/Switch | — | Disponibiliza ou oculta no sistema |
| Vigência (início/fim) | Não | Date Picker | Início <= Fim ou indefinido |  |
| Descrição Interna | Não | Textarea | Max. 255 caracteres | Uso interno |

### Cadastro de Regra por Tabela

| Campo | Obrigatório | Tipo de Componente | Validação | Observações |
| :-- | :--: | :-- | :-- | :-- |
| Unidade de Venda | Sim | Dropdown/Select | Uma das opções cadastradas (unidade, m², etc.) | Para definir base de desconto |
| Faixa Inicial | Sim | Numérico | >= 0 |  |
| Faixa Final | Sim | Numérico | > faixa inicial |  |
| Percentual de Desconto (%) | Não (ver ao lado) | Numérico (%) | 0% a 100%; obrigatório se sem valor fixo | Um dos dois: percentual ou valor |
| Valor Fixo de Desconto | Não (ver ao lado) | Numérico (R\$) | >= 0; obrigatório se sem percentual | Um dos dois: valor ou percentual |
| Produtos/Categorias | Não | Multiselect/Dropdown | Opcional | Aplicação segmentada das regras |
| Observações | Não | Textarea | Max. 255 caracteres | Uso interno |

**Validação cruzada das regras:**

- Não permitir faixas sobrepostas por unidade de venda dentro da mesma tabela.
- Exigir pelo menos uma regra por tabela.


## Critérios de Aceite

- O módulo deve funcionar 100% de forma independente, podendo ser instalado ou removido do ambiente da loja sem comprometer outros módulos do sistema[^6].
- Permite criação, edição, inativação e ativação de tabelas e regras de desconto.
- No orçamento, cada item deve receber automaticamente a regra coerente conforme unidade de venda e tabela selecionada.
- Impedir exclusão de tabelas vinculadas a orçamentos ativos; permitir apenas inativação.
- Histórico/log das alterações de política, vinculando usuário, data e operação.
- Interface amigável e responsiva para todas as funções administrativas.
- Todas as validações e restrições descritas acima são mandatórias.


## Detalhes para Marketplace

- O módulo/API deve ser estruturado para ser facilmente plugado/desplugado na loja do cliente, em linha com as melhores práticas de modularidade e marketplaces do mercado de e-commerce, permitindo aquisição on demand[^3][^6].
- Toda a lógica, banco de dados e endpoints RESTful devem ser segregados.
- Dependências externas (se houver) devem ser mapeadas e documentadas.

**Se houver alguma dúvida sobre regras comerciais específicas, exceções ou integrações que deseja detalhar, por favor sinalize antes do início da implementação.**

<div style="text-align: center">⁂</div>

[^1]: https://www.irroba.com.br

[^2]: https://www.uniecommerceweek.com.br

[^3]: https://inteligence.com.br/e-commerce/6-e-commerce-plano-bronze.html

[^4]: https://store.senior.com.br/loja/ClicTecnologia/produto/clicvendahubcombo3-integradordemarketplacese-commercecomerpsenior/hub-de-integracao-com-marketplace-e-commerce

[^5]: https://www.ecommercepuro.com.br/parcerias

[^6]: https://www.modulomagento.com.br/modulo-sorteio-desconto-promocao-cupom-magento-2

[^7]: https://www.ecommercebrasil.com.br/artigos/utilizando-regras-de-frete-como-estrategia-de-venda-no-e-commerce

[^8]: https://www.ecommercebrasil.com.br/artigos/estrategias-resultado-e-commerce

[^9]: https://hibrido.com.br

[^10]: https://plataformasdeecommerce.com.br/comparativo-plataformas-ecommerce/

