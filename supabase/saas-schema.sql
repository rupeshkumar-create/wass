-- SaaS Multi-Tenant Award Management Schema
-- This extends the existing schema with multi-tenant capabilities
-- Run this AFTER the main schema.sql

-- Create additional enums for SaaS features
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE award_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE timeline_phase AS ENUM ('setup', 'nominations_open', 'nominations_closed', 'voting_open', 'voting_closed', 'results');

-- Clients/Tenants table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    logo_url TEXT,
    website TEXT,
    status client_status DEFAULT 'active',
    subscription_plan TEXT DEFAULT 'basic',
    max_awards INTEGER DEFAULT 1,
    max_categories_per_award INTEGER DEFAULT 10,
    max_nominees_per_award INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Awards table (each client can have multiple awards)
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL-friendly identifier
    description TEXT,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    logo_url TEXT,
    website TEXT,
    status award_status DEFAULT 'draft',
    current_phase timeline_phase DEFAULT 'setup',
    
    -- Timeline settings
    nominations_start_date TIMESTAMPTZ,
    nominations_end_date TIMESTAMPTZ,
    voting_start_date TIMESTAMPTZ,
    voting_end_date TIMESTAMPTZ,
    results_date TIMESTAMPTZ,
    
    -- Configuration
    allow_self_nomination BOOLEAN DEFAULT true,
    require_company_for_person BOOLEAN DEFAULT true,
    max_nominations_per_email INTEGER DEFAULT 5,
    max_votes_per_email INTEGER DEFAULT 1,
    
    -- Branding
    primary_color TEXT DEFAULT '#f97316', -- orange-500
    secondary_color TEXT DEFAULT '#1f2937', -- gray-800
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique slug per client
    UNIQUE(client_id, slug)
);

-- Categories table (each award can have multiple categories)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL-friendly identifier
    description TEXT,
    icon TEXT, -- Lucide icon name
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    max_nominees INTEGER, -- NULL = unlimited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique slug per award
    UNIQUE(award_id, slug)
);

-- Update existing nominations table to support multi-tenant
ALTER TABLE nominations ADD COLUMN IF NOT EXISTS award_id UUID REFERENCES awards(id) ON DELETE CASCADE;
ALTER TABLE nominations ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE nominations ADD COLUMN IF NOT EXISTS manual_votes INTEGER DEFAULT 0; -- For manual vote adjustments

-- Update existing votes table to support multi-tenant
ALTER TABLE votes ADD COLUMN IF NOT EXISTS award_id UUID REFERENCES awards(id) ON DELETE CASCADE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Settings table for award-specific configurations
CREATE TABLE award_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(award_id, key)
);

-- CSV Upload tracking
CREATE TABLE csv_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    status TEXT DEFAULT 'processing', -- processing, completed, failed
    errors JSONB, -- Array of error messages
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Reports table for generated reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'votes', 'nominees', 'leads', 'summary'
    format TEXT NOT NULL, -- 'csv', 'excel', 'pdf'
    filename TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    parameters JSONB, -- Filter parameters used
    status TEXT DEFAULT 'generating', -- generating, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Certificates table for auto-generated certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    nomination_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'winner', 'finalist', 'participant'
    template_id TEXT, -- Reference to certificate template
    certificate_url TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created_at ON clients(created_at);

CREATE INDEX idx_awards_client_id ON awards(client_id);
CREATE INDEX idx_awards_slug ON awards(client_id, slug);
CREATE INDEX idx_awards_status ON awards(status);
CREATE INDEX idx_awards_phase ON awards(current_phase);
CREATE INDEX idx_awards_year ON awards(year);

CREATE INDEX idx_categories_award_id ON categories(award_id);
CREATE INDEX idx_categories_slug ON categories(award_id, slug);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort ON categories(sort_order);

CREATE INDEX idx_nominations_award_id ON nominations(award_id);
CREATE INDEX idx_nominations_category_id ON nominations(category_id);

CREATE INDEX idx_votes_award_id ON votes(award_id);
CREATE INDEX idx_votes_category_id ON votes(category_id);

CREATE INDEX idx_award_settings_award_key ON award_settings(award_id, key);

CREATE INDEX idx_csv_uploads_award_id ON csv_uploads(award_id);
CREATE INDEX idx_csv_uploads_status ON csv_uploads(status);

CREATE INDEX idx_reports_award_id ON reports(award_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);

CREATE INDEX idx_certificates_award_id ON certificates(award_id);
CREATE INDEX idx_certificates_nomination_id ON certificates(nomination_id);

-- Update triggers for updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awards_updated_at 
    BEFORE UPDATE ON awards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_award_settings_updated_at 
    BEFORE UPDATE ON award_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (bypasses RLS)
CREATE POLICY "Allow all operations for service role" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON awards FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON award_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON csv_uploads FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON certificates FOR ALL USING (true);

-- Utility functions

-- Function to get award with categories and stats
CREATE OR REPLACE FUNCTION get_award_dashboard(award_uuid UUID)
RETURNS TABLE (
    award JSONB,
    categories JSONB,
    stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(a.*) as award,
        COALESCE((
            SELECT jsonb_agg(to_jsonb(c.*) ORDER BY c.sort_order)
            FROM categories c 
            WHERE c.award_id = award_uuid AND c.is_active = true
        ), '[]'::jsonb) as categories,
        jsonb_build_object(
            'total_nominations', COALESCE((SELECT COUNT(*) FROM nominations WHERE award_id = award_uuid), 0),
            'total_votes', COALESCE((SELECT COUNT(*) FROM votes WHERE award_id = award_uuid), 0),
            'categories_count', COALESCE((SELECT COUNT(*) FROM categories WHERE award_id = award_uuid AND is_active = true), 0)
        ) as stats
    FROM awards a
    WHERE a.id = award_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create default categories for new award
CREATE OR REPLACE FUNCTION create_default_categories(award_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO categories (award_id, name, slug, description, icon, sort_order) VALUES
    (award_uuid, 'Best Staffing Agency', 'best-staffing-agency', 'Recognizing excellence in staffing services', 'Building2', 1),
    (award_uuid, 'Best Recruitment Consultant', 'best-recruitment-consultant', 'Outstanding individual recruitment performance', 'User', 2),
    (award_uuid, 'Innovation in Recruitment', 'innovation-recruitment', 'Innovative approaches to talent acquisition', 'Lightbulb', 3),
    (award_uuid, 'Best Client Service', 'best-client-service', 'Excellence in client relationship management', 'Heart', 4),
    (award_uuid, 'Rising Star', 'rising-star', 'Emerging talent in the staffing industry', 'Star', 5);
END;
$$ LANGUAGE plpgsql;

-- Function to update award phase based on timeline
CREATE OR REPLACE FUNCTION update_award_phases()
RETURNS VOID AS $$
BEGIN
    -- Update to nominations_open
    UPDATE awards 
    SET current_phase = 'nominations_open'
    WHERE current_phase = 'setup' 
    AND nominations_start_date <= NOW() 
    AND (nominations_end_date IS NULL OR nominations_end_date > NOW());
    
    -- Update to nominations_closed
    UPDATE awards 
    SET current_phase = 'nominations_closed'
    WHERE current_phase = 'nominations_open' 
    AND nominations_end_date <= NOW();
    
    -- Update to voting_open
    UPDATE awards 
    SET current_phase = 'voting_open'
    WHERE current_phase IN ('nominations_closed', 'nominations_open')
    AND voting_start_date <= NOW() 
    AND (voting_end_date IS NULL OR voting_end_date > NOW());
    
    -- Update to voting_closed
    UPDATE awards 
    SET current_phase = 'voting_closed'
    WHERE current_phase = 'voting_open' 
    AND voting_end_date <= NOW();
    
    -- Update to results
    UPDATE awards 
    SET current_phase = 'results'
    WHERE current_phase = 'voting_closed' 
    AND results_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default client for existing data
INSERT INTO clients (id, name, slug, email, company, status) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'World Staffing Awards',
    'world-staffing-awards',
    'admin@worldstaffingawards.com',
    'World Staffing Awards',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- Insert default award for existing data
INSERT INTO awards (id, client_id, name, slug, year, status, current_phase) 
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'World Staffing Awards 2026',
    'wsa-2026',
    2026,
    'active',
    'nominations_open'
) ON CONFLICT (client_id, slug) DO NOTHING;

-- Create default categories
SELECT create_default_categories('00000000-0000-0000-0000-000000000002');

-- Update existing nominations to use default award and map categories
UPDATE nominations 
SET award_id = '00000000-0000-0000-0000-000000000002',
    category_id = (
        SELECT id FROM categories 
        WHERE award_id = '00000000-0000-0000-0000-000000000002' 
        AND slug = CASE 
            WHEN nominations.category = 'Best Staffing Agency' THEN 'best-staffing-agency'
            WHEN nominations.category = 'Best Recruitment Consultant' THEN 'best-recruitment-consultant'
            WHEN nominations.category = 'Innovation in Recruitment' THEN 'innovation-recruitment'
            WHEN nominations.category = 'Best Client Service' THEN 'best-client-service'
            WHEN nominations.category = 'Rising Star' THEN 'rising-star'
            ELSE 'best-staffing-agency' -- Default fallback
        END
        LIMIT 1
    )
WHERE award_id IS NULL;

-- Update existing votes to use default award and map categories
UPDATE votes 
SET award_id = '00000000-0000-0000-0000-000000000002',
    category_id = (
        SELECT id FROM categories 
        WHERE award_id = '00000000-0000-0000-0000-000000000002' 
        AND slug = CASE 
            WHEN votes.category = 'Best Staffing Agency' THEN 'best-staffing-agency'
            WHEN votes.category = 'Best Recruitment Consultant' THEN 'best-recruitment-consultant'
            WHEN votes.category = 'Innovation in Recruitment' THEN 'innovation-recruitment'
            WHEN votes.category = 'Best Client Service' THEN 'best-client-service'
            WHEN votes.category = 'Rising Star' THEN 'rising-star'
            ELSE 'best-staffing-agency' -- Default fallback
        END
        LIMIT 1
    )
WHERE award_id IS NULL;

-- Create indexes on new foreign key columns
CREATE INDEX IF NOT EXISTS idx_nominations_award_category ON nominations(award_id, category_id);
CREATE INDEX IF NOT EXISTS idx_votes_award_category ON votes(award_id, category_id);

COMMIT;