-- Itens existentes com arte do cliente: entrar na fila com data de referência
UPDATE `itens_os`
SET `arte_fila_desde` = COALESCE(`arte_fila_desde`, `criado_em`)
WHERE `responsabilidade_arte` = 'CLIENTE_FORNECE'
  AND `status_arte` IN (
    'AGUARDANDO_ARQUIVO_CLIENTE',
    'ARQUIVO_RECEBIDO',
    'EM_CRIACAO',
    'AGUARDANDO_CLIENTE',
    'REVISAO_SOLICITADA',
    'APROVADA',
    'LIBERADA_PCP'
  );
