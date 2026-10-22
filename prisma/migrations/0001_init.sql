-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NULL,
    `email` VARCHAR(200) NULL,
    `gotram` VARCHAR(100) NULL,
    `nakshatram` VARCHAR(100) NULL,
    `rashi` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_mobile_key`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_users_username_key`(`username`),
    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(20) NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_sessions_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `relationship_label` VARCHAR(100) NULL,
    `gotram` VARCHAR(100) NULL,
    `nakshatram` VARCHAR(100) NULL,
    `rashi` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `family_members_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `one_to_one_poojas` (
    `id` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `category_id` VARCHAR(100) NULL,
    `title` JSON NOT NULL,
    `subtitle` JSON NOT NULL,
    `short_desc` JSON NOT NULL,
    `full_desc` JSON NOT NULL,
    `deity` JSON NOT NULL,
    `tradition` JSON NULL,
    `ideal_days` JSON NULL,
    `benefits` JSON NOT NULL,
    `mode_available` VARCHAR(20) NOT NULL DEFAULT 'both',
    `min_lead_hours` INTEGER NOT NULL DEFAULT 48,
    `starting_price` INTEGER NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `faqs` JSON NOT NULL,
    `deliverables` JSON NOT NULL,
    `arrangements` JSON NULL,
    `home_prep` JSON NULL,
    `prerequisites` JSON NULL,
    `is_flagship` BOOLEAN NOT NULL DEFAULT false,
    `occasion_ids` JSON NULL,
    `duration_range` VARCHAR(50) NULL,
    `related_slugs` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `one_to_one_poojas_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pooja_packages` (
    `id` VARCHAR(100) NOT NULL,
    `pooja_id` VARCHAR(100) NOT NULL,
    `name` JSON NOT NULL,
    `tagline` JSON NOT NULL,
    `duration_mins` INTEGER NOT NULL,
    `pandits_count` INTEGER NOT NULL DEFAULT 1,
    `price` INTEGER NOT NULL,
    `features` JSON NOT NULL,
    `inclusions` JSON NULL,
    `samagri` BOOLEAN NOT NULL DEFAULT true,
    `online_eligible` BOOLEAN NOT NULL DEFAULT true,
    `temple_eligible` BOOLEAN NOT NULL DEFAULT true,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `description` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `pooja_packages_pooja_id_idx`(`pooja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_poojas` (
    `id` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` JSON NOT NULL,
    `subtitle` JSON NOT NULL,
    `deity` JSON NOT NULL,
    `short_desc` JSON NOT NULL,
    `full_desc` JSON NULL,
    `next_date` DATETIME(3) NOT NULL,
    `tithi_info` JSON NOT NULL,
    `booking_closes` JSON NULL,
    `time_display` JSON NULL,
    `duration_mins` INTEGER NULL,
    `category_tag` JSON NULL,
    `frequency` JSON NULL,
    `price_online` INTEGER NOT NULL,
    `price_offline` INTEGER NOT NULL,
    `online_includes` JSON NOT NULL,
    `offline_includes` JSON NOT NULL,
    `deliverables` JSON NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `faqs` JSON NOT NULL,
    `sankalpam_info` JSON NULL,
    `live_info` JSON NULL,
    `prasadam_info` JSON NULL,
    `prev_highlights` JSON NULL,
    `venue_name` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `group_poojas_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_packages` (
    `id` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `name` JSON NOT NULL,
    `description` JSON NOT NULL,
    `cycle_count` INTEGER NOT NULL,
    `price_per_person` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `mode` VARCHAR(20) NOT NULL DEFAULT 'online',
    `prasadam_enabled` BOOLEAN NOT NULL DEFAULT true,
    `prasadam_price` INTEGER NULL,
    `annadanam_enabled` BOOLEAN NOT NULL DEFAULT true,
    `pass_eligible` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `included_poojas` JSON NOT NULL,
    `benefits` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `group_packages_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pooja_categories` (
    `id` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `name` JSON NOT NULL,
    `description` JSON NOT NULL,
    `icon_name` VARCHAR(100) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `pooja_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `occasions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` JSON NOT NULL,
    `subtitle` JSON NULL,
    `slug` VARCHAR(120) NULL,
    `pooja_id` VARCHAR(100) NULL,
    `next_date` VARCHAR(30) NULL,
    `frequency` JSON NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_ref` VARCHAR(30) NOT NULL,
    `user_id` INTEGER NULL,
    `booking_type` VARCHAR(20) NOT NULL,
    `pooja_id` VARCHAR(100) NOT NULL,
    `pooja_slug` VARCHAR(120) NOT NULL,
    `pooja_title` JSON NOT NULL,
    `deity` JSON NULL,
    `package_name` JSON NULL,
    `package_price` INTEGER NULL,
    `mode` VARCHAR(20) NOT NULL,
    `scheduled_date` VARCHAR(20) NOT NULL,
    `scheduled_slot` VARCHAR(50) NULL,
    `duration_mins` INTEGER NULL,
    `customer_name` VARCHAR(200) NOT NULL,
    `customer_mobile` VARCHAR(20) NOT NULL,
    `customer_email` VARCHAR(200) NULL,
    `participants_count` INTEGER NOT NULL DEFAULT 1,
    `add_ons` JSON NOT NULL,
    `breakdown` JSON NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    `sankalpam_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `current_stage` VARCHAR(40) NOT NULL DEFAULT 'booking_confirmed',
    `participants` JSON NULL,
    `meet_url` VARCHAR(500) NULL,
    `is_live` BOOLEAN NOT NULL DEFAULT false,
    `youtube_url` VARCHAR(500) NULL,
    `recording_url` VARCHAR(500) NULL,
    `recording_data` JSON NULL,
    `razorpay_order_id` VARCHAR(100) NULL,
    `razorpay_payment_id` VARCHAR(100) NULL,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `package_purchase_id` VARCHAR(100) NULL,
    `occurrence_id` VARCHAR(100) NULL,
    `time_display` JSON NULL,
    `tithi_info` JSON NULL,
    `temple_venue` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_booking_ref_key`(`booking_ref`),
    UNIQUE INDEX `bookings_razorpay_order_id_key`(`razorpay_order_id`),
    INDEX `bookings_user_id_idx`(`user_id`),
    INDEX `bookings_customer_mobile_idx`(`customer_mobile`),
    INDEX `bookings_booking_type_idx`(`booking_type`),
    INDEX `bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_holds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` VARCHAR(100) NOT NULL,
    `pooja_slug` VARCHAR(120) NOT NULL,
    `date` VARCHAR(20) NOT NULL,
    `slot_id` VARCHAR(100) NOT NULL,
    `time_string` VARCHAR(50) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `slot_holds_session_id_idx`(`session_id`),
    INDEX `slot_holds_pooja_slug_date_slot_id_idx`(`pooja_slug`, `date`, `slot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pass_configs` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `price` INTEGER NOT NULL,
    `name` JSON NOT NULL,
    `tagline` JSON NOT NULL,
    `description` JSON NOT NULL,
    `benefits_sequence` JSON NOT NULL,
    `recurring_benefit` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_passes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pass_number` VARCHAR(30) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `customer_name` VARCHAR(200) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `purchased_date` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `no_expiry` BOOLEAN NOT NULL DEFAULT true,
    `total_savings` INTEGER NOT NULL DEFAULT 0,
    `benefits_used_count` INTEGER NOT NULL DEFAULT 0,
    `benefit_history` JSON NOT NULL,
    `razorpay_order_id` VARCHAR(100) NULL,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customer_passes_pass_number_key`(`pass_number`),
    UNIQUE INDEX `customer_passes_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `package_purchases` (
    `id` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NULL,
    `customer_name` VARCHAR(200) NOT NULL,
    `customer_mobile` VARCHAR(20) NOT NULL,
    `customer_email` VARCHAR(200) NULL,
    `package_id` VARCHAR(100) NOT NULL,
    `package_snapshot` JSON NOT NULL,
    `participant_count` INTEGER NOT NULL,
    `participant_profiles` JSON NOT NULL,
    `price_per_person` INTEGER NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `tax` INTEGER NOT NULL DEFAULT 0,
    `addon_prasadam` INTEGER NOT NULL DEFAULT 0,
    `addon_annadanam` INTEGER NOT NULL DEFAULT 0,
    `discount` INTEGER NOT NULL DEFAULT 0,
    `final_amount` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `entitled_count` INTEGER NOT NULL,
    `completed_count` INTEGER NOT NULL DEFAULT 0,
    `occurrences` JSON NOT NULL,
    `payment_ref` VARCHAR(100) NULL,
    `razorpay_order_id` VARCHAR(100) NULL,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `temple_timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    `purchase_timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `package_purchases_razorpay_order_id_key`(`razorpay_order_id`),
    INDEX `package_purchases_user_id_idx`(`user_id`),
    INDEX `package_purchases_customer_mobile_idx`(`customer_mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` JSON NOT NULL,
    `answer` JSON NOT NULL,
    `category` VARCHAR(50) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image_url` VARCHAR(500) NOT NULL,
    `alt_text` JSON NULL,
    `title` JSON NULL,
    `category` VARCHAR(50) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `devotee_name` VARCHAR(200) NOT NULL,
    `location` VARCHAR(200) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `content` JSON NOT NULL,
    `rating` INTEGER NULL,
    `video_url` VARCHAR(500) NULL,
    `is_video` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recordings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` JSON NOT NULL,
    `deity` JSON NULL,
    `pooja_date` VARCHAR(20) NOT NULL,
    `video_url` VARCHAR(500) NOT NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `duration_mins` INTEGER NULL,
    `pandit_name` VARCHAR(200) NULL,
    `pooja_type` VARCHAR(20) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(200) NOT NULL,
    `title` JSON NOT NULL,
    `subtitle` JSON NULL,
    `content` JSON NOT NULL,
    `author` VARCHAR(200) NULL,
    `image_url` VARCHAR(500) NULL,
    `category` VARCHAR(100) NULL,
    `tags` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blogs_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `razorpay_order_id` VARCHAR(100) NOT NULL,
    `razorpay_payment_id` VARCHAR(100) NULL,
    `razorpay_signature` VARCHAR(500) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(5) NOT NULL DEFAULT 'INR',
    `entity_type` VARCHAR(20) NOT NULL,
    `entity_id` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `webhook_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_razorpay_order_id_key`(`razorpay_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `to_mobile` VARCHAR(20) NOT NULL,
    `template` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(20) NULL,
    `entity_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
    `error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pooja_packages` ADD CONSTRAINT `pooja_packages_pooja_id_fkey` FOREIGN KEY (`pooja_id`) REFERENCES `one_to_one_poojas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_passes` ADD CONSTRAINT `customer_passes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `package_purchases` ADD CONSTRAINT `package_purchases_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `group_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

