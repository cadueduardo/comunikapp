CREATE TABLE `product_update` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `summary` VARCHAR(500) NOT NULL,
  `content` TEXT NOT NULL,
  `version` VARCHAR(80) NULL,
  `commit_sha` VARCHAR(64) NULL,
  `environment` VARCHAR(32) NULL,
  `category` ENUM('NEW_MODULE', 'FEATURE', 'IMPROVEMENT', 'FIX', 'SECURITY', 'NOTICE') NOT NULL,
  `modules` JSON NULL,
  `audience` JSON NULL,
  `status` ENUM('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `origin` ENUM('DEPLOY_AUTOMATION', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
  `changelog_enabled` BOOLEAN NOT NULL DEFAULT true,
  `in_app_enabled` BOOLEAN NOT NULL DEFAULT false,
  `email_enabled` BOOLEAN NOT NULL DEFAULT false,
  `idempotency_key` VARCHAR(191) NULL,
  `scheduled_at` DATETIME(3) NULL,
  `published_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `author_id` VARCHAR(191) NULL,
  `reviewer_id` VARCHAR(191) NULL,
  `publisher_id` VARCHAR(191) NULL,

  UNIQUE INDEX `product_update_slug_key`(`slug`),
  UNIQUE INDEX `product_update_idempotency_key_key`(`idempotency_key`),
  INDEX `product_update_status_created_idx`(`status`, `created_at`),
  INDEX `product_update_published_at_idx`(`published_at`),
  INDEX `product_update_environment_commit_idx`(`environment`, `commit_sha`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_update_revision` (
  `id` VARCHAR(191) NOT NULL,
  `product_update_id` VARCHAR(191) NOT NULL,
  `revision_number` INTEGER NOT NULL,
  `snapshot` JSON NOT NULL,
  `change_reason` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by_id` VARCHAR(191) NULL,

  UNIQUE INDEX `product_update_revision_number_key`(`product_update_id`, `revision_number`),
  INDEX `product_update_revision_created_by_id_idx`(`created_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_update`
  ADD CONSTRAINT `product_update_author_id_fkey`
  FOREIGN KEY (`author_id`) REFERENCES `admin_user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `product_update_reviewer_id_fkey`
  FOREIGN KEY (`reviewer_id`) REFERENCES `admin_user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `product_update_publisher_id_fkey`
  FOREIGN KEY (`publisher_id`) REFERENCES `admin_user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_update_revision`
  ADD CONSTRAINT `product_update_revision_update_id_fkey`
  FOREIGN KEY (`product_update_id`) REFERENCES `product_update`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `product_update_revision_created_by_id_fkey`
  FOREIGN KEY (`created_by_id`) REFERENCES `admin_user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
