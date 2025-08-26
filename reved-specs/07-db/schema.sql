-- Schéma de base de données pour RevEd Specs
-- Version: 1.0
-- Date: 2025-08-24

-- Base de données principale
CREATE DATABASE IF NOT EXISTS reved_specs
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE reved_specs;

-- Table des compétences
CREATE TABLE skills (
    skill_id VARCHAR(20) PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    level VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain (domain),
    INDEX idx_level (level)
);

-- Table des prérequis
CREATE TABLE prerequisites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id VARCHAR(20) NOT NULL,
    prerequisite_id VARCHAR(20) NOT NULL,
    strength ENUM('weak', 'medium', 'strong') DEFAULT 'medium',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES skills(skill_id) ON DELETE CASCADE,
    UNIQUE KEY unique_prerequisite (skill_id, prerequisite_id),
    INDEX idx_skill (skill_id),
    INDEX idx_prerequisite (prerequisite_id)
);

-- Table des exercices
CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) UNIQUE NOT NULL,
    version INT NOT NULL DEFAULT 1,
    revision_notes TEXT,
    skill_id VARCHAR(20) NOT NULL,
    source_skill_path VARCHAR(255),
    difficulty_level INT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 6),
    exercise_type ENUM('QCM', 'QCM_Image', 'Fill_in_the_Blank', 'Drag_and_Drop', 'Schema_Drawing', 'Handwriting') NOT NULL,
    locale VARCHAR(5) NOT NULL,
    age_target_min INT,
    age_target_max INT,
    time_limit_seconds INT,
    question_text TEXT NOT NULL,
    question_audio_url VARCHAR(500),
    image_prompt TEXT,
    image_url VARCHAR(500),
    correct_option_id VARCHAR(20),
    correct_answer TEXT,
    key_concept_takeaway TEXT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 0,
    hint_penalty INT NOT NULL DEFAULT 0,
    tags JSON,
    generator_meta JSON NOT NULL,
    judge_scores JSON NOT NULL,
    reviewer VARCHAR(100),
    review_date TIMESTAMP NULL,
    content_hash VARCHAR(64),
    license VARCHAR(50),
    visibility ENUM('public', 'internal', 'experimental') DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE RESTRICT,
    INDEX idx_exercise_id (exercise_id),
    INDEX idx_skill_id (skill_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (exercise_type),
    INDEX idx_locale (locale),
    INDEX idx_visibility (visibility),
    INDEX idx_content_hash (content_hash)
);

-- Table des options pour les QCM
CREATE TABLE exercise_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    option_id VARCHAR(20) NOT NULL,
    text TEXT,
    image_prompt TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    UNIQUE KEY unique_option (exercise_id, option_id),
    INDEX idx_exercise (exercise_id)
);

-- Table des solutions étape par étape
CREATE TABLE exercise_solutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    step_number INT NOT NULL,
    explanation_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    UNIQUE KEY unique_step (exercise_id, step_number),
    INDEX idx_exercise (exercise_id)
);

-- Table des métadonnées de validation
CREATE TABLE validation_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    validation_type ENUM('schema', 'quality_gates', 'duplicate_check') NOT NULL,
    status ENUM('passed', 'failed', 'warning') NOT NULL,
    score DECIMAL(3,2),
    errors JSON,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    INDEX idx_exercise (exercise_id),
    INDEX idx_type (validation_type),
    INDEX idx_status (status)
);

-- Table des statistiques d'utilisation
CREATE TABLE exercise_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    attempts_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    average_time_seconds DECIMAL(8,2),
    difficulty_rating DECIMAL(3,2),
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    UNIQUE KEY unique_exercise_stats (exercise_id),
    INDEX idx_exercise (exercise_id),
    INDEX idx_difficulty_rating (difficulty_rating)
);

-- Vues utiles
CREATE VIEW exercise_summary AS
SELECT 
    e.exercise_id,
    e.skill_id,
    s.skill_name,
    s.domain,
    e.difficulty_level,
    e.exercise_type,
    e.locale,
    e.visibility,
    e.judge_scores->>'$.overall' as overall_score,
    e.judge_scores->>'$.clarity' as clarity_score,
    e.judge_scores->>'$.factuality' as factuality_score,
    e.judge_scores->>'$.age_fit' as age_fit_score,
    e.created_at,
    es.attempts_count,
    es.success_count,
    CASE 
        WHEN es.attempts_count > 0 
        THEN (es.success_count / es.attempts_count) * 100 
        ELSE NULL 
    END as success_rate
FROM exercises e
LEFT JOIN skills s ON e.skill_id = s.skill_id
LEFT JOIN exercise_stats es ON e.exercise_id = es.exercise_id;

-- Procédures stockées utiles
DELIMITER //

CREATE PROCEDURE GetExercisesBySkill(IN skill_id_param VARCHAR(20))
BEGIN
    SELECT 
        e.*,
        s.skill_name,
        s.domain
    FROM exercises e
    JOIN skills s ON e.skill_id = s.skill_id
    WHERE e.skill_id = skill_id_param
    AND e.visibility = 'public'
    ORDER BY e.difficulty_level, e.created_at;
END //

CREATE PROCEDURE GetExercisesByDifficulty(IN min_level INT, IN max_level INT)
BEGIN
    SELECT 
        e.*,
        s.skill_name,
        s.domain
    FROM exercises e
    JOIN skills s ON e.skill_id = s.skill_id
    WHERE e.difficulty_level BETWEEN min_level AND max_level
    AND e.visibility = 'public'
    ORDER BY e.skill_id, e.difficulty_level;
END //

CREATE PROCEDURE UpdateExerciseStats(
    IN exercise_id_param VARCHAR(50),
    IN success BOOLEAN,
    IN time_seconds DECIMAL(8,2)
)
BEGIN
    INSERT INTO exercise_stats (exercise_id, attempts_count, success_count, average_time_seconds, last_used_at)
    VALUES (exercise_id_param, 1, IF(success, 1, 0), time_seconds, NOW())
    ON DUPLICATE KEY UPDATE
        attempts_count = attempts_count + 1,
        success_count = success_count + IF(success, 1, 0),
        average_time_seconds = (average_time_seconds * attempts_count + time_seconds) / (attempts_count + 1),
        last_used_at = NOW();
END //

DELIMITER ;

-- Index supplémentaires pour les performances
CREATE INDEX idx_exercises_composite ON exercises(skill_id, difficulty_level, visibility);
CREATE INDEX idx_exercises_quality ON exercises(visibility, difficulty_level);
CREATE INDEX idx_validation_composite ON validation_metadata(exercise_id, validation_type, status);

-- Contraintes de vérification (MySQL 8.0+)
ALTER TABLE exercises 
ADD CONSTRAINT chk_difficulty_level CHECK (difficulty_level BETWEEN 1 AND 6),
ADD CONSTRAINT chk_xp_reward CHECK (xp_reward >= 0),
ADD CONSTRAINT chk_hint_penalty CHECK (hint_penalty >= 0),
ADD CONSTRAINT chk_age_target CHECK (age_target_min >= 3 AND age_target_max <= 20);

-- Commentaires pour la documentation
ALTER TABLE exercises COMMENT = 'Table principale des exercices pédagogiques RevEd';
ALTER TABLE skills COMMENT = 'Référentiel des compétences CP2025';
ALTER TABLE prerequisites COMMENT = 'Relations de prérequis entre compétences';
ALTER TABLE exercise_options COMMENT = 'Options pour les exercices de type QCM';
ALTER TABLE exercise_solutions COMMENT = 'Solutions détaillées étape par étape';
ALTER TABLE validation_metadata COMMENT = 'Métadonnées de validation et qualité';
ALTER TABLE exercise_stats COMMENT = 'Statistiques d\'utilisation des exercices';
