-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  template_html TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificate_templates_award_id ON certificate_templates(award_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_category_id ON certificate_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_active ON certificate_templates(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_certificate_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_templates_updated_at();

-- Add RLS policies
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read templates
CREATE POLICY "Users can view certificate templates" ON certificate_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to manage templates
CREATE POLICY "Service role can manage certificate templates" ON certificate_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default certificate template
INSERT INTO certificate_templates (name, award_id, template_html) 
SELECT 
  'Default Certificate Template',
  id,
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Georgia'', serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .certificate { background: white; padding: 60px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 800px; margin: 0 auto; }
    .header { color: #333; margin-bottom: 30px; }
    .title { font-size: 48px; font-weight: bold; color: #2c3e50; margin: 20px 0; }
    .subtitle { font-size: 24px; color: #7f8c8d; margin: 10px 0; }
    .recipient { font-size: 36px; color: #e74c3c; margin: 30px 0; font-weight: bold; }
    .company { font-size: 20px; color: #34495e; margin: 10px 0; }
    .category { font-size: 18px; color: #9b59b6; margin: 20px 0; }
    .footer { margin-top: 40px; color: #7f8c8d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1 class="title">CERTIFICATE OF EXCELLENCE</h1>
      <p class="subtitle">{{award_name}} {{award_year}}</p>
    </div>
    
    <p style="font-size: 18px; margin: 30px 0;">This certificate is proudly presented to</p>
    
    <h2 class="recipient">{{nominee_name}}</h2>
    <p class="company">{{nominee_company}}</p>
    
    <p style="font-size: 18px; margin: 30px 0;">For outstanding achievement in</p>
    <p class="category">{{category_name}}</p>
    
    <p style="font-size: 16px; margin: 40px 0;">Recognized for excellence in staffing and recruitment</p>
    
    <div class="footer">
      <p>Date: {{date}}</p>
      <p>Position: {{position}}</p>
    </div>
  </div>
</body>
</html>'
FROM awards 
WHERE NOT EXISTS (
  SELECT 1 FROM certificate_templates 
  WHERE certificate_templates.award_id = awards.id
);