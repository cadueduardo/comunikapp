-- Criar tabela estoque_sobras no banco principal 'comunikapp'
-- Observa os campos usados em SobrasService

CREATE TABLE IF NOT EXISTS `estoque_sobras` (
  `id`               varchar(36)  NOT NULL,
  `estoque_id`       varchar(36)  NULL,
  `codigo_sobra`     varchar(50)  NOT NULL,
  `descricao`        text         NOT NULL,
  `dimensoes`        varchar(100) NULL,
  `area`             decimal(10,2) NULL,
  `quantidade`       decimal(10,2) NOT NULL,
  `unidade_medida`   varchar(16)  NOT NULL,
  `material`         varchar(60)  NOT NULL,
  `cor`              varchar(40)  NULL,
  `acabamento`       varchar(40)  NULL,
  `status`           varchar(20)  NOT NULL DEFAULT 'DISPONIVEL', -- DISPONIVEL|APROVEITADA|VENCIDA|DESCARTADA|RESERVADA
  `origem`           varchar(120) NULL,
  `data_geracao`     datetime     NOT NULL,
  `orcamento_origem` varchar(60)  NULL,
  `data_aproveitamento` datetime  NULL,
  `quantidade_aproveitada` decimal(10,2) NOT NULL DEFAULT 0,
  `economia_gerada`  decimal(12,2) NOT NULL DEFAULT 0,
  `loja_id`          varchar(36)  NOT NULL,
  `created_at`       datetime     NOT NULL,
  `updated_at`       datetime     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_estoque_sobras_loja` (`loja_id`),
  KEY `idx_estoque_sobras_data` (`data_geracao`),
  KEY `idx_estoque_sobras_codigo_loja` (`codigo_sobra`, `loja_id`),
  CONSTRAINT `fk_estoque_sobras_item` FOREIGN KEY (`estoque_id`) REFERENCES `itens_estoque` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


