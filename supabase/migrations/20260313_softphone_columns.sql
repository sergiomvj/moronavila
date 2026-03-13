ALTER TABLE residents
ADD COLUMN IF NOT EXISTS softphone_extension TEXT,
ADD COLUMN IF NOT EXISTS softphone_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS softphone_display_name TEXT;
