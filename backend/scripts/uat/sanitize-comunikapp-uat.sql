-- Sanitização UAT — ComunikApp
-- Versão: 20260901.1
-- Alvo exclusivo: database comunikapp_uat (MySQL 8)
-- Idempotente. Não imprime valores. Preserva PKs/FKs/unique via substitutos únicos.
-- Não executar contra o database de produção `comunikapp`.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET SESSION sql_safe_updates = 0;

-- Aborta imediatamente se o database atual não for UAT (divisão por zero, sem DDL).
SET @__uat_ok := (SELECT IF(DATABASE() = 'comunikapp_uat', 1, 0));
SET @__uat_guard := 1 / @__uat_ok;

SET @script_versao := '20260901.1';
SET @executado_em := CURRENT_TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS _uat_sanitization_run (
  script_versao VARCHAR(32) NOT NULL,
  aplicado_em DATETIME(3) NOT NULL,
  database_alvo VARCHAR(64) NOT NULL,
  PRIMARY KEY (script_versao, aplicado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS _uat_sanitization_counts (
  executado_em DATETIME(3) NOT NULL,
  script_versao VARCHAR(32) NOT NULL,
  item VARCHAR(96) NOT NULL,
  quantidade BIGINT NOT NULL,
  PRIMARY KEY (executado_em, item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS _uat_exec_if_table;
DELIMITER //
CREATE PROCEDURE _uat_exec_if_table(IN p_table VARCHAR(64), IN p_sql TEXT)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND TABLE_TYPE = 'BASE TABLE'
  ) THEN
    SET @q = p_sql;
    PREPARE stmt FROM @q;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS _uat_exec_if_column;
DELIMITER //
CREATE PROCEDURE _uat_exec_if_column(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_sql TEXT)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @q = p_sql;
    PREPARE stmt FROM @q;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS _uat_count;
DELIMITER //
CREATE PROCEDURE _uat_count(IN p_item VARCHAR(96), IN p_sql TEXT)
BEGIN
  SET @q = p_sql;
  PREPARE stmt FROM @q;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  INSERT INTO _uat_sanitization_counts (executado_em, script_versao, item, quantidade)
  VALUES (@executado_em, @script_versao, p_item, @c);
END //
DELIMITER ;

-- Contagens antes (sem valores).
CALL _uat_count('antes_usuario', 'SELECT COUNT(*) INTO @c FROM usuario');
CALL _uat_count('antes_loja', 'SELECT COUNT(*) INTO @c FROM loja');
CALL _uat_count('antes_cliente', 'SELECT COUNT(*) INTO @c FROM cliente');
CALL _uat_count('antes_fornecedor', 'SELECT COUNT(*) INTO @c FROM fornecedor');
CALL _uat_count('antes_convites_cadastro', 'SELECT COUNT(*) INTO @c FROM convites_cadastro');
CALL _uat_count('antes_password_reset_token', 'SELECT COUNT(*) INTO @c FROM password_reset_token');
CALL _uat_count('antes_admin_user', 'SELECT COUNT(*) INTO @c FROM admin_user');
CALL _uat_count('antes_admin_session', 'SELECT COUNT(*) INTO @c FROM admin_session');
CALL _uat_count('antes_arte_links_aprovacao', 'SELECT COUNT(*) INTO @c FROM arte_links_aprovacao');
CALL _uat_count('antes_orcamento', 'SELECT COUNT(*) INTO @c FROM orcamento');
CALL _uat_count('antes_notificacao', 'SELECT COUNT(*) INTO @c FROM notificacao');
CALL _uat_count('antes_eventos_mysql', 'SELECT COUNT(*) INTO @c FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()');

-- ---------------------------------------------------------------------------
-- usuario: e-mail único, telefone fictício, 2FA/códigos removidos, nomes genéricos.
-- senha: NULL aqui; o runner operacional pode gravar hash de bootstrap UAT.
-- ---------------------------------------------------------------------------
UPDATE usuario
SET
  email = CONCAT('usuario+', id, '@uat.invalid'),
  telefone = IF(
    telefone IS NULL,
    NULL,
    CONCAT('+5500', LPAD(CRC32(id) MOD 100000000, 8, '0'))
  ),
  codigo_verificacao_email = NULL,
  codigo_verificacao_email_expiracao = NULL,
  two_factor_secret = NULL,
  two_factor_enabled = 0,
  two_factor_confirmed_at = NULL,
  senha = NULL,
  nome_completo = CONCAT('Usuario UAT ', LEFT(id, 8)),
  nome = CONCAT('UAT ', LEFT(id, 8))
WHERE email NOT LIKE '%@uat.invalid';

-- ---------------------------------------------------------------------------
-- loja: contato, documentos globais únicos, Stripe, token de domínio, sessão.
-- slug/nome da loja preservados (identidade operacional do tenant de teste).
-- ---------------------------------------------------------------------------
UPDATE loja
SET
  email = CONCAT('loja+', id, '@uat.invalid'),
  telefone = CONCAT('+5500', LPAD(CRC32(id) MOD 100000000, 8, '0')),
  cnpj = NULL,
  cpf = NULL,
  stripe_customer_id = NULL,
  dominio_custom_token = NULL,
  dominio_custom_cf_id = NULL,
  dominio_custom_cf_status = NULL,
  dominio_custom_cf_ssl_status = NULL,
  dominio_custom_cf_validation = NULL,
  inscricao_estadual = NULL,
  inscricao_municipal = NULL,
  cep = IF(cep IS NULL, NULL, '00000-000'),
  logradouro = IF(logradouro IS NULL, NULL, 'Rua UAT'),
  numero = IF(numero IS NULL, NULL, '0'),
  complemento = NULL,
  bairro = IF(bairro IS NULL, NULL, 'UAT'),
  session_version = IF(session_version < 1000000, session_version + 1000000, session_version)
WHERE email NOT LIKE '%@uat.invalid';

-- ---------------------------------------------------------------------------
-- cliente: PII de contato e documento; FKs intactas.
-- ---------------------------------------------------------------------------
UPDATE cliente
SET
  email = IF(email IS NULL, NULL, CONCAT('cliente+', id, '@uat.invalid')),
  telefone = IF(telefone IS NULL, NULL, CONCAT('+5500', LPAD(CRC32(CONCAT(id, 't')) MOD 100000000, 8, '0'))),
  whatsapp = IF(whatsapp IS NULL, NULL, CONCAT('+5500', LPAD(CRC32(CONCAT(id, 'w')) MOD 100000000, 8, '0'))),
  documento = CONCAT('UAT', LPAD(CRC32(id), 10, '0')),
  inscricao_estadual = NULL,
  cep = IF(cep IS NULL, NULL, '00000-000'),
  endereco = IF(endereco IS NULL, NULL, 'Rua UAT'),
  numero = IF(numero IS NULL, NULL, '0'),
  complemento = NULL,
  bairro = IF(bairro IS NULL, NULL, 'UAT'),
  cidade = IF(cidade IS NULL, NULL, 'UAT'),
  estado = IF(estado IS NULL, NULL, 'XX'),
  responsavel = IF(responsavel IS NULL, NULL, CONCAT('Contato UAT ', LEFT(id, 8))),
  nome = CONCAT('Cliente UAT ', LEFT(id, 8)),
  razao_social = IF(razao_social IS NULL, NULL, CONCAT('Razao UAT ', LEFT(id, 8))),
  nome_fantasia = IF(nome_fantasia IS NULL, NULL, CONCAT('Fantasia UAT ', LEFT(id, 8)))
WHERE documento NOT LIKE 'UAT%';

-- ---------------------------------------------------------------------------
-- fornecedor
-- ---------------------------------------------------------------------------
UPDATE fornecedor
SET
  email = IF(email IS NULL, NULL, CONCAT('fornecedor+', id, '@uat.invalid')),
  telefone = IF(telefone IS NULL, NULL, CONCAT('+5500', LPAD(CRC32(CONCAT(id, 't')) MOD 100000000, 8, '0'))),
  whatsapp = IF(whatsapp IS NULL, NULL, CONCAT('+5500', LPAD(CRC32(CONCAT(id, 'w')) MOD 100000000, 8, '0'))),
  cnpj_cpf = IF(cnpj_cpf IS NULL, NULL, CONCAT('UAT', LPAD(CRC32(id), 10, '0'))),
  contato_nome = IF(contato_nome IS NULL, NULL, CONCAT('Contato UAT ', LEFT(id, 8))),
  cep = IF(cep IS NULL, NULL, '00000-000'),
  endereco = IF(endereco IS NULL, NULL, 'Rua UAT'),
  numero = IF(numero IS NULL, NULL, '0'),
  complemento = NULL
WHERE (email IS NULL OR email NOT LIKE '%@uat.invalid')
  AND (cnpj_cpf IS NULL OR cnpj_cpf NOT LIKE 'UAT%');

-- ---------------------------------------------------------------------------
-- convites de cadastro: tokens inutilizáveis e únicos; e-mails fictícios.
-- ---------------------------------------------------------------------------
UPDATE convites_cadastro
SET
  email = CONCAT('convite+', id, '@uat.invalid'),
  telefone = IF(telefone IS NULL, NULL, CONCAT('+5500', LPAD(CRC32(id) MOD 100000000, 8, '0'))),
  criado_por_email = IF(criado_por_email IS NULL, NULL, CONCAT('autor-convite+', id, '@uat.invalid')),
  token_hash = SHA2(CONCAT('uat-revoked-', id), 256),
  status = IF(status IN ('PENDENTE', 'PENDING'), 'REVOGADO', status),
  revogado_em = IF(revogado_em IS NULL AND status IN ('PENDENTE', 'PENDING'), CURRENT_TIMESTAMP(3), revogado_em),
  nome = IF(nome IS NULL, NULL, CONCAT('Convite UAT ', LEFT(id, 8)))
WHERE email NOT LIKE '%@uat.invalid';

UPDATE convites_cadastro
SET
  status = 'REVOGADO',
  revogado_em = IFNULL(revogado_em, CURRENT_TIMESTAMP(3))
WHERE status IN ('PENDENTE', 'PENDING');

DELETE FROM password_reset_token;

-- ---------------------------------------------------------------------------
-- admin: e-mail único, 2FA removido, sessões revogadas.
-- password_hash é NOT NULL; o runner substitui por hash de bootstrap UAT.
-- ---------------------------------------------------------------------------
UPDATE admin_user
SET
  email = CONCAT('admin+', id, '@uat.invalid'),
  nome = CONCAT('Admin UAT ', LEFT(id, 8)),
  two_factor_secret = NULL,
  two_factor_enabled = 0,
  two_factor_confirmed_at = NULL,
  failed_login_attempts = 0,
  locked_until = NULL
WHERE email NOT LIKE '%@uat.invalid';

DELETE FROM admin_session;

UPDATE admin_invitation
SET
  email = CONCAT('admin-convite+', id, '@uat.invalid'),
  token_hash = LEFT(SHA2(CONCAT('uat-revoked-', id), 256), 64),
  status = IF(status = 'PENDING', 'CANCELLED', status),
  cancelled_at = IF(status = 'PENDING' AND cancelled_at IS NULL, CURRENT_TIMESTAMP(3), cancelled_at)
WHERE email NOT LIKE '%@uat.invalid';

UPDATE admin_audit_log
SET
  previous_state = JSON_OBJECT('uat', 'redacted'),
  new_state = JSON_OBJECT('uat', 'redacted'),
  ip_address = NULL,
  user_agent = NULL,
  metadata = JSON_OBJECT('uat', 'redacted')
WHERE previous_state IS NULL
   OR JSON_UNQUOTE(JSON_EXTRACT(previous_state, '$.uat')) IS NULL
   OR JSON_UNQUOTE(JSON_EXTRACT(previous_state, '$.uat')) <> 'redacted';

-- ---------------------------------------------------------------------------
-- orçamento: invalida código de aprovação (claro e hash).
-- ---------------------------------------------------------------------------
UPDATE orcamento
SET
  codigo_aprovacao = NULL,
  codigo_aprovacao_hash = NULL,
  codigo_aprovacao_expira_em = CURRENT_TIMESTAMP(3),
  codigo_aprovacao_revogado_em = IFNULL(codigo_aprovacao_revogado_em, CURRENT_TIMESTAMP(3))
WHERE codigo_aprovacao IS NOT NULL
   OR codigo_aprovacao_hash IS NOT NULL;

CALL _uat_exec_if_column(
  'orcamento',
  'aceite_evidencia',
  'UPDATE orcamento SET aceite_evidencia = JSON_OBJECT(''uat'',''redacted'') WHERE aceite_evidencia IS NOT NULL AND (JSON_UNQUOTE(JSON_EXTRACT(aceite_evidencia, ''$.uat'')) IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(aceite_evidencia, ''$.uat'')) <> ''redacted'')'
);

-- ---------------------------------------------------------------------------
-- Arte: tokens públicos, e-mails de autor, Drive, URLs externas.
-- ---------------------------------------------------------------------------
UPDATE arte_links_aprovacao
SET
  token_publico = CONCAT('uat-arte-', id),
  ativo = 0,
  ip_aprovacao = NULL,
  user_agent = NULL
WHERE token_publico NOT LIKE 'uat-arte-%';

UPDATE arte_mensagens
SET autor_email = IF(autor_email IS NULL, NULL, CONCAT('arte+', id, '@uat.invalid'))
WHERE autor_email IS NOT NULL AND autor_email NOT LIKE '%@uat.invalid';

UPDATE itens_os
SET arte_drive_folder_id = NULL
WHERE arte_drive_folder_id IS NOT NULL;

UPDATE arte_arquivos
SET
  url_arquivo = CONCAT('uat://neutralized/', id),
  url_thumbnail = IF(url_thumbnail IS NULL, NULL, CONCAT('uat://neutralized-thumb/', id)),
  storage_path = CONCAT('uat://neutralized/', id)
WHERE url_arquivo NOT LIKE 'uat://neutralized/%';

UPDATE mensagemnegociacao
SET autor_email = IF(autor_email IS NULL, NULL, CONCAT('msg+', id, '@uat.invalid'))
WHERE autor_email IS NOT NULL AND autor_email NOT LIKE '%@uat.invalid';

UPDATE LinkPublico
SET
  token = CONCAT('uat-link-', id),
  senha = NULL,
  ativo = 0
WHERE token NOT LIKE 'uat-link-%';

UPDATE AcessoLink
SET
  ip = NULL,
  user_agent = NULL,
  ip_acesso = NULL
WHERE ip IS NOT NULL OR ip_acesso IS NOT NULL OR user_agent IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Notificações e product updates: não reenviar para produção.
-- ---------------------------------------------------------------------------
UPDATE notificacao
SET
  dados_extras = NULL,
  visualizada = 1
WHERE dados_extras IS NOT NULL OR visualizada = 0;

CALL _uat_exec_if_column(
  'notificacao',
  'url_destino',
  'UPDATE notificacao SET url_destino = NULL WHERE url_destino IS NOT NULL'
);
CALL _uat_exec_if_column(
  'notificacao',
  'lida_em',
  'UPDATE notificacao SET lida_em = IFNULL(lida_em, CURRENT_TIMESTAMP(3)) WHERE lida_em IS NULL'
);

UPDATE product_update
SET
  email_enabled = 0,
  in_app_enabled = 0,
  scheduled_at = NULL
WHERE email_enabled = 1 OR in_app_enabled = 1 OR scheduled_at IS NOT NULL;

UPDATE relatorios_tecnicos_instalacao
SET
  pdf_token = LEFT(CONCAT('uat', id), 36),
  pdf_url = CONCAT('uat://neutralized/', id)
WHERE pdf_url NOT LIKE 'uat://neutralized/%';

-- ---------------------------------------------------------------------------
-- Integrações OAuth / JSON de conexão (tabela pode estar vazia ou ausente
-- em snapshots antigos; o helper ignora se a tabela não existir).
-- ---------------------------------------------------------------------------
CALL _uat_exec_if_table(
  'loja_conexao',
  'UPDATE loja_conexao SET configuracao_json = NULL, status = ''DESCONECTADO'' WHERE status <> ''DESCONECTADO'' OR configuracao_json IS NOT NULL'
);

CALL _uat_exec_if_table(
  'outbox_email_vendas',
  'UPDATE outbox_email_vendas SET estado = ''descartado'', bloqueado_em = CURRENT_TIMESTAMP(3), bloqueado_por = ''uat-sanitize'', payload_sanitizado = JSON_OBJECT(''uat'',''neutralized''), destinatario_email_hash = REPEAT(''0'', 64), proxima_tentativa_em = CURRENT_TIMESTAMP(3) WHERE estado IN (''pendente'',''processando'')'
);

CALL _uat_exec_if_table(
  'cliente_contato',
  'UPDATE cliente_contato SET email = IF(email IS NULL, NULL, CONCAT(''contato+'', id, ''@uat.invalid'')), telefone = IF(telefone IS NULL, NULL, CONCAT(''+5500'', LPAD(CRC32(CONCAT(id, ''t'')) MOD 100000000, 8, ''0''))), whatsapp = IF(whatsapp IS NULL, NULL, CONCAT(''+5500'', LPAD(CRC32(CONCAT(id, ''w'')) MOD 100000000, 8, ''0''))), nome = CONCAT(''Contato UAT '', LEFT(id, 8)) WHERE email IS NULL OR email NOT LIKE ''%@uat.invalid'''
);

CALL _uat_exec_if_table(
  'store_user_invitation',
  'UPDATE store_user_invitation SET email = CONCAT(''store-convite+'', id, ''@uat.invalid''), telefone = IF(telefone IS NULL, NULL, CONCAT(''+5500'', LPAD(CRC32(id) MOD 100000000, 8, ''0''))), token_hash = LEFT(SHA2(CONCAT(''uat-revoked-'', id), 256), 64), status = IF(status = ''PENDING'', ''CANCELLED'', status), cancelled_at = IF(status = ''PENDING'' AND cancelled_at IS NULL, CURRENT_TIMESTAMP(3), cancelled_at) WHERE email NOT LIKE ''%@uat.invalid'''
);

CALL _uat_exec_if_table(
  'loja_audit_log',
  'UPDATE loja_audit_log SET previous_state = JSON_OBJECT(''uat'',''redacted''), new_state = JSON_OBJECT(''uat'',''redacted''), ip_address = NULL, user_agent = NULL WHERE previous_state IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(previous_state, ''$.uat'')) IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(previous_state, ''$.uat'')) <> ''redacted'''
);

-- Desabilita eventos do Event Scheduler no schema atual, se houver.

DROP PROCEDURE IF EXISTS _uat_disable_events;
DELIMITER //
CREATE PROCEDURE _uat_disable_events()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE ev_name VARCHAR(64);
  DECLARE cur CURSOR FOR
    SELECT EVENT_NAME
    FROM information_schema.EVENTS
    WHERE EVENT_SCHEMA = DATABASE();
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO ev_name;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;
    SET @q = CONCAT('ALTER EVENT `', ev_name, '` DISABLE');
    PREPARE s FROM @q;
    EXECUTE s;
    DEALLOCATE PREPARE s;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;
CALL _uat_disable_events();
DROP PROCEDURE _uat_disable_events;

-- Contagens depois.
CALL _uat_count('depois_usuario_email_uat', 'SELECT COUNT(*) INTO @c FROM usuario WHERE email LIKE ''%@uat.invalid''');
CALL _uat_count('depois_loja_email_uat', 'SELECT COUNT(*) INTO @c FROM loja WHERE email LIKE ''%@uat.invalid''');
CALL _uat_count('depois_cliente_doc_uat', 'SELECT COUNT(*) INTO @c FROM cliente WHERE documento LIKE ''UAT%''');
CALL _uat_count('depois_password_reset_token', 'SELECT COUNT(*) INTO @c FROM password_reset_token');
CALL _uat_count('depois_admin_session', 'SELECT COUNT(*) INTO @c FROM admin_session');
CALL _uat_count('depois_arte_links_inativos', 'SELECT COUNT(*) INTO @c FROM arte_links_aprovacao WHERE ativo = 0');
CALL _uat_count('depois_orcamento_codigo_claro', 'SELECT COUNT(*) INTO @c FROM orcamento WHERE codigo_aprovacao IS NOT NULL');
CALL _uat_count('depois_orcamento_codigo_hash', 'SELECT COUNT(*) INTO @c FROM orcamento WHERE codigo_aprovacao_hash IS NOT NULL');
CALL _uat_count('depois_loja_stripe', 'SELECT COUNT(*) INTO @c FROM loja WHERE stripe_customer_id IS NOT NULL');
CALL _uat_count('depois_eventos_mysql', 'SELECT COUNT(*) INTO @c FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()');
CALL _uat_count('depois_eventos_enabled', 'SELECT COUNT(*) INTO @c FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE() AND STATUS = ''ENABLED''');

INSERT INTO _uat_sanitization_run (script_versao, aplicado_em, database_alvo)
VALUES (@script_versao, @executado_em, DATABASE());

DROP PROCEDURE IF EXISTS _uat_exec_if_table;
DROP PROCEDURE IF EXISTS _uat_exec_if_column;
DROP PROCEDURE IF EXISTS _uat_count;

SELECT
  DATABASE() AS database_alvo,
  @script_versao AS script_versao,
  @executado_em AS executado_em,
  'ok' AS sanitizacao;
