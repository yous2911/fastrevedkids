-- Migration: Create correct students table matching Drizzle schema
-- Date: 2025-01-27

-- Drop existing students table if it exists (be careful in production!)
DROP TABLE IF EXISTS `students`;

-- Create students table matching Drizzle schema
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `date_naissance` date NOT NULL,
  `niveau_actuel` varchar(20) NOT NULL,
  `total_points` int DEFAULT '0',
  `serie_jours` int DEFAULT '0',
  `mascotte_type` varchar(50) DEFAULT 'dragon',
  `dernier_acces` timestamp NULL DEFAULT NULL,
  `est_connecte` tinyint(1) DEFAULT '0',
  `failed_login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `niveau_scolaire` varchar(20) NOT NULL,
  `mascotte_color` varchar(20) DEFAULT '#ff6b35',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
