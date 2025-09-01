-- Nomination Toggle System Schema
-- Allows admin to enable/disable nominations globally

-- 1. Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insert default nomination settings
INSERT INTO public.system_settings (setting_key, setting_value, description) 
VALUES 
  ('nominations_enabled', 'true', 'Controls whether nominations are open or closed'),
  ('nominations_close_message', 'Thank you for your interest! Nominations are now closed. Please check back for voting opportunities.', 'Message shown when nominations are closed')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_system_settings_timestamp_trigger ON public.system_settings;
CREATE TRIGGER update_system_settings_timestamp_trigger
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- 5. Grant permissions
GRANT SELECT ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_settings TO anon;
GRANT ALL ON public.system_settings TO service_role;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- 7. Create view for easy access to settings
CREATE OR REPLACE VIEW public.app_settings AS
SELECT 
  setting_key,
  setting_value,
  CASE 
    WHEN setting_value = 'true' THEN true
    WHEN setting_value = 'false' THEN false
    ELSE NULL
  END as boolean_value,
  description,
  updated_at
FROM public.system_settings;

GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.app_settings TO anon;