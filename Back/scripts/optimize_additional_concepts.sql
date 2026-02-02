-- =========================================
-- SCRIPT PARA OPTIMIZAR TABLAS DE CONCEPTOS
-- =========================================

-- Paso 1: Eliminar la relación foránea si existe
ALTER TABLE additional_concepts DROP FOREIGN KEY IF EXISTS additional_concepts_ibfk_1;

-- Paso 2: Eliminar el campo user_id de additional_concepts
ALTER TABLE additional_concepts DROP COLUMN IF EXISTS user_id;

-- Paso 3: Modificar el campo applies_to para que solo acepte 'all'
ALTER TABLE additional_concepts 
MODIFY COLUMN applies_to ENUM('all') NOT NULL DEFAULT 'all';

-- Paso 4: Actualizar todos los registros existentes a 'all'
UPDATE additional_concepts SET applies_to = 'all' WHERE applies_to IS NULL OR applies_to != 'all';

-- Paso 5: Opcional - Limpiar registros que no tengan mes de aplicación
DELETE FROM additional_concepts WHERE application_month IS NULL OR application_month = '';

-- =========================================
-- VERIFICACIÓN
-- =========================================

-- Mostrar estructura actualizada
DESCRIBE additional_concepts;

-- Mostrar datos actualizados
SELECT * FROM additional_concepts;
