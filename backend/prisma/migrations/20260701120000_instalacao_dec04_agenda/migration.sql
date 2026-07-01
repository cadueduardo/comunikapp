-- Instalação DEC-04 + Agenda (Passo 1a)
-- Status OS instalação, turno/equipe no lote, retenção comercial na expedição

-- AlterTable: rollup operacional da OS (DEC-04)
ALTER TABLE `ordens_servico` ADD COLUMN `status_instalacao_os` ENUM('EM_ANDAMENTO', 'AGUARDANDO_RELATORIO_TECNICO', 'CONCLUIDA') NULL;

-- AlterTable: agendamento por lote (UX-02 / UX-03)
ALTER TABLE `itens_os_instalacao` ADD COLUMN `turno_previsao` ENUM('MANHA', 'TARDE', 'INTEIRO') NULL;
ALTER TABLE `itens_os_instalacao` ADD COLUMN `equipe_instalacao` VARCHAR(120) NULL;

-- AlterTable: estado intermediário de expedição pós-instalação (DEC-04)
ALTER TABLE `expedicoes_logistica` MODIFY COLUMN `status` ENUM('AGUARDANDO_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'EM_ROTA_DE_ENTREGA', 'AGUARDANDO_INSTALACAO', 'AGUARDANDO_FECHAMENTO', 'ENTREGUE_FINALIZADO', 'ARQUIVADO', 'DEVOLVIDA') NOT NULL DEFAULT 'AGUARDANDO_SEPARACAO';
