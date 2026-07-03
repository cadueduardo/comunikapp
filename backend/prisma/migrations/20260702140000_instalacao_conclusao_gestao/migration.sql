-- Conclusão de lote pela gestão (alçada operador) com motivo quando sem assinatura

ALTER TABLE `itens_os_instalacao`
  ADD COLUMN `origem_conclusao_lote` ENUM('CAMPO', 'GESTAO') NULL,
  ADD COLUMN `motivo_sem_assinatura` ENUM(
    'CLIENTE_AUSENTE',
    'CLIENTE_RECUSOU_ASSINAR',
    'ASSINATURA_CANAL_ALTERNATIVO',
    'INSTALADOR_SEM_APP',
    'EVIDENCIA_SUFICIENTE',
    'OUTROS'
  ) NULL,
  ADD COLUMN `observacao_conclusao_gestao` TEXT NULL,
  ADD COLUMN `conclusao_gestao_por` VARCHAR(191) NULL,
  ADD COLUMN `conclusao_gestao_em` DATETIME(3) NULL;
