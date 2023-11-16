-- CreateTable
CREATE TABLE `_checkpoints` (
    `id` VARCHAR(10) NOT NULL,
    `block_number` BIGINT NOT NULL,
    `contract_address` VARCHAR(66) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_metadatas` (
    `id` VARCHAR(20) NOT NULL,
    `value` VARCHAR(128) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_template_sources` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `contract_address` VARCHAR(66) NULL,
    `start_block` BIGINT NOT NULL,
    `template` VARCHAR(128) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` INTEGER NOT NULL,
    `owner` VARCHAR(256) NOT NULL,
    `mint_timestamp` INTEGER NOT NULL,
    `token0` VARCHAR(256) NOT NULL,
    `token1` VARCHAR(256) NOT NULL,
    `fee` VARCHAR(256) NOT NULL,
    `tick_spacing` VARCHAR(256) NOT NULL,
    `extension` VARCHAR(256) NOT NULL,
    `bound_lower_mag` VARCHAR(256) NOT NULL,
    `bound_lower_sign` VARCHAR(256) NOT NULL,
    `bound_upper_mag` VARCHAR(256) NOT NULL,
    `bound_upper_sign` VARCHAR(256) NOT NULL,
    `initial_amount0` VARCHAR(256) NOT NULL,
    `initial_amount1` VARCHAR(256) NOT NULL,
    `sqrt_ratio` VARCHAR(256) NULL,
    `fees0` VARCHAR(256) NULL,
    `fees1` VARCHAR(256) NULL,
    `amount0` VARCHAR(256) NULL,
    `amount1` VARCHAR(256) NULL,
    `total_initial_amount_usd` FLOAT NULL,
    `total_current_amount_usd` FLOAT NULL,
    `total_fees_amount_usd` FLOAT NULL,
    `total_pnl_usd` FLOAT NULL,
    `total_apr` FLOAT NULL,
    `fee_apr` FLOAT NULL,

    INDEX `positions_amount0_index`(`amount0`),
    INDEX `positions_amount1_index`(`amount1`),
    INDEX `positions_bound_lower_mag_index`(`bound_lower_mag`),
    INDEX `positions_bound_lower_sign_index`(`bound_lower_sign`),
    INDEX `positions_bound_upper_mag_index`(`bound_upper_mag`),
    INDEX `positions_bound_upper_sign_index`(`bound_upper_sign`),
    INDEX `positions_extension_index`(`extension`),
    INDEX `positions_fee_index`(`fee`),
    INDEX `positions_fee_apr_index`(`fee_apr`),
    INDEX `positions_fees0_index`(`fees0`),
    INDEX `positions_fees1_index`(`fees1`),
    INDEX `positions_id_index`(`id`),
    INDEX `positions_initial_amount0_index`(`initial_amount0`),
    INDEX `positions_initial_amount1_index`(`initial_amount1`),
    INDEX `positions_mint_timestamp_index`(`mint_timestamp`),
    INDEX `positions_owner_index`(`owner`),
    INDEX `positions_sqrt_ratio_index`(`sqrt_ratio`),
    INDEX `positions_tick_spacing_index`(`tick_spacing`),
    INDEX `positions_token0_index`(`token0`),
    INDEX `positions_token1_index`(`token1`),
    INDEX `positions_total_apr_index`(`total_apr`),
    INDEX `positions_total_current_amount_usd_index`(`total_current_amount_usd`),
    INDEX `positions_total_fees_amount_usd_index`(`total_fees_amount_usd`),
    INDEX `positions_total_initial_amount_usd_index`(`total_initial_amount_usd`),
    INDEX `positions_total_pnl_usd_index`(`total_pnl_usd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
