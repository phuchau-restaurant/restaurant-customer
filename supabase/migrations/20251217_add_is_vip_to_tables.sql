-- Add is_vip column to tables
ALTER TABLE tables ADD COLUMN is_vip BOOLEAN DEFAULT false;
