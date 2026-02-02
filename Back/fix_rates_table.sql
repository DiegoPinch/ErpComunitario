-- Fix rates table to allow NULL values for start_date and end_date
USE water_system;

ALTER TABLE rates 
MODIFY COLUMN start_date DATE NULL,
MODIFY COLUMN end_date DATE NULL;
