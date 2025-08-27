-- Migration: Add missing tables for tests
-- Date: 2025-01-27

-- Add competences table
CREATE TABLE IF NOT EXISTS `competences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `description` text,
  `niveau` varchar(20) NOT NULL,
  `matiere` varchar(50) NOT NULL,
  `domaine` varchar(100) DEFAULT NULL,
  `sous_domaine` varchar(100) DEFAULT NULL,
  `prerequis` json DEFAULT NULL,
  `indicateurs` json DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add exercise_attempts table
CREATE TABLE IF NOT EXISTS `exercise_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `time_spent` int NOT NULL,
  `answers` json DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `feedback` text,
  `attempt_number` int DEFAULT '1',
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `exercise_attempts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exercise_attempts_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add competences column to exercises table if it doesn't exist
ALTER TABLE `exercises` ADD COLUMN IF NOT EXISTS `competences` json DEFAULT NULL AFTER `competence_code`;

-- Insert some basic competences for testing
INSERT IGNORE INTO `competences` (`code`, `titre`, `description`, `niveau`, `matiere`, `domaine`, `sous_domaine`) VALUES
('CP.2025.1', 'Compter jusqu\'à 10', 'Compter et dénombrer jusqu\'à 10', 'CP', 'mathematiques', 'Nombres et calculs', 'Compter'),
('CP.2025.2', 'Addition simple', 'Additionner des nombres jusqu\'à 10', 'CP', 'mathematiques', 'Nombres et calculs', 'Addition'),
('CP.2025.3', 'Lecture de syllabes', 'Lire des syllabes simples', 'CP', 'francais', 'Lecture', 'Déchiffrage'),
('CE1.2025.1', 'Compter jusqu\'à 100', 'Compter et dénombrer jusqu\'à 100', 'CE1', 'mathematiques', 'Nombres et calculs', 'Compter'),
('CE1.2025.2', 'Addition avec retenue', 'Additionner avec retenue', 'CE1', 'mathematiques', 'Nombres et calculs', 'Addition'),
('CE2.2025.1', 'Multiplication simple', 'Multiplier par 2, 5, 10', 'CE2', 'mathematiques', 'Nombres et calculs', 'Multiplication');
