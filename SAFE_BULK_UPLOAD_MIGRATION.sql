-- Safe Bulk Upload Migration Script
-- This script safely adds bulk upload functionality to existing database
-- Run this step by step to avoid conflicts

-- =====================================================
-- STEP 1: CHECK EXISTING SCHEMA
-- =====================================================

-- Check if app_settings table already exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_settings') THEN
        RAISE NOTICE 'app_settings table already exists - will update structure if needed';
    ELSE
        RAISE NOTICE 'app_settings table does not exist - will create new';
    END IF;
END $$;

-- =====================================================
-- STEP 2: SAFELY ADD COLUMNS TO NOMINATIONS TABLE
-- =====================================================

-- Add bulk upload columns to nominations table (safe - uses IF NOT EXISTS)
DO $$
BEGIN
    -- Add upload_source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'upload_source') THEN
        ALTER TABLE nominations ADD COLUMN upload_source VARCHAR(20) DEFAULT 'form' 
        CHECK (upload_source IN ('form', 'bulk_upload'));
        RAISE NOTICE 'Added upload_source column to nominations';
    END IF;

    -- Add bulk_upload_batch_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'bulk_upload_batch_id') THEN
        ALTER TABLE nominations ADD COLUMN bulk_upload_batch_id UUID;
        RAISE NOTICE 'Added bulk_upload_batch_id column to nominations';
    END IF;

    -- Add bulk_upload_row_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'bulk_upload_row_number') THEN
        ALTER TABLE nominations ADD COLUMN bulk_upload_row_number INTEGER;
        RAISE NOTICE 'Added bulk_upload_row_number column to nominations';
    END IF;

    -- Add bulk_upload_errors column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'bulk_upload_errors') THEN
        ALTER TABLE nominations ADD COLUMN bulk_upload_errors TEXT;
        RAISE NOTICE 'Added bulk_upload_errors column to nominations';
    END IF;

    -- Add uploaded_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'uploaded_by') THEN
        ALTER TABLE nominations ADD COLUMN uploaded_by VARCHAR(100);
        RAISE NOTICE 'Added uploaded_by column to nominations';
    END IF;

    -- Add uploaded_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'uploaded_at') THEN
        ALTER TABLE nominations ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added uploaded_at column to nominations';
    END IF;

    -- Add is_draft column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'is_draft') THEN
        ALTER TABLE nominations ADD COLUMN is_draft BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_draft column to nominations';
    END IF;

    -- Add Loops sync columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'loops_contact_id') THEN
        ALTER TABLE nominations ADD COLUMN loops_contact_id VARCHAR(255);
        RAISE NOTICE 'Added loops_contact_id column to nominations';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'loops_sync_status') THEN
        ALTER TABLE nominations ADD COLUMN loops_sync_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added loops_sync_status column to nominations';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'loops_sync_error') THEN
        ALTER TABLE nominations ADD COLUMN loops_sync_error TEXT;
        RAISE NOTICE 'Added loops_sync_error column to nominations';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'loops_last_sync_at') THEN
        ALTER TABLE nominations ADD COLUMN loops_last_sync_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added loops_last_sync_at column to nominations';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'nominations' AND column_name = 'sync_to_loops_on_approval') THEN
        ALTER TABLE nominations ADD COLUMN sync_to_loops_on_approval BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added sync_to_loops_on_approval column to nominations';
    END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE NEW TABLES
-- =====================================================

-- Create bulk_upload_batches table
CREATE TABLE IF NOT EXISTS bulk_upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    draft_rows INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_summary TEXT,
    csv_headers JSONB,
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bulk_upload_errors table
CREATE TABLE IF NOT EXISTS bulk_upload_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES bulk_upload_batches(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    error_message TEXT NOT NULL,
    error_type VARCHAR(50) DEFAULT 'validation',
    raw_data JSONB,
    suggested_fix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loops_sync_queue table
CREATE TABLE IF NOT EXISTS loops_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_id UUID REFERENCES nominations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 5,
    payload JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: HANDLE APP_SETTINGS TABLE SAFELY
-- =====================================================

-- Create or update app_settings table
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_settings') THEN
        -- Create new table
        CREATE TABLE app_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            setting_type VARCHAR(50) DEFAULT 'string',
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_by VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by VARCHAR(100),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new app_settings table';
    ELSE
        -- Add missing columns to existing table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'setting_type') THEN
            ALTER TABLE app_settings ADD COLUMN setting_type VARCHAR(50) DEFAULT 'string';
            RAISE NOTICE 'Added setting_type column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'description') THEN
            ALTER TABLE app_settings ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'is_active') THEN
            ALTER TABLE app_settings ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Added is_active column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'created_by') THEN
            ALTER TABLE app_settings ADD COLUMN created_by VARCHAR(100);
            RAISE NOTICE 'Added created_by column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'updated_by') THEN
            ALTER TABLE app_settings ADD COLUMN updated_by VARCHAR(100);
            RAISE NOTICE 'Added updated_by column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'created_at') THEN
            ALTER TABLE app_settings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to existing app_settings table';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'app_settings' AND column_name = 'updated_at') THEN
            ALTER TABLE app_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to existing app_settings table';
        END IF;
    END IF;
END $$;

-- =====================================================
-- STEP 5: INSERT DEFAULT SETTINGS
-- =====================================================

-- Insert default settings (safe with ON CONFLICT)
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, created_by)
VALUES 
    ('nomination_deadline', NULL, 'date', 'Deadline for accepting new nominations', 'system'),
    ('nominations_open', 'true', 'boolean', 'Whether nominations are currently open', 'system'),
    ('voting_only_mode', 'false', 'boolean', 'Whether only voting is allowed (nominations closed)', 'system'),
    ('bulk_upload_enabled', 'true', 'boolean', 'Whether bulk upload feature is enabled', 'system'),
    ('auto_approve_bulk_uploads', 'false', 'boolean', 'Whether to auto-approve bulk uploaded nominees', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- STEP 6: CREATE INDEXES
-- =====================================================

-- Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_nominations_upload_source ON nominations(upload_source);
CREATE INDEX IF NOT EXISTS idx_nominations_bulk_batch ON nominations(bulk_upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_nominations_is_draft ON nominations(is_draft);
CREATE INDEX IF NOT EXISTS idx_nominations_uploaded_by ON nominations(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_status ON bulk_upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_uploaded_by ON bulk_upload_batches(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bulk_errors_batch ON bulk_upload_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_active ON app_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_nominations_loops_sync_status ON nominations(loops_sync_status);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_status ON loops_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_scheduled ON loops_sync_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_priority ON loops_sync_queue(priority, scheduled_for);

-- =====================================================
-- STEP 7: CREATE FUNCTIONS
-- =====================================================

-- Function to update bulk batch statistics
CREATE OR REPLACE FUNCTION update_bulk_batch_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE bulk_upload_batches 
        SET 
            processed_rows = (
                SELECT COUNT(*) 
                FROM nominations 
                WHERE bulk_upload_batch_id = NEW.bulk_upload_batch_id
            ),
            successful_rows = (
                SELECT COUNT(*) 
                FROM nominations 
                WHERE bulk_upload_batch_id = NEW.bulk_upload_batch_id 
                AND bulk_upload_errors IS NULL
            ),
            failed_rows = (
                SELECT COUNT(*) 
                FROM nominations 
                WHERE bulk_upload_batch_id = NEW.bulk_upload_batch_id 
                AND bulk_upload_errors IS NOT NULL
            ),
            draft_rows = (
                SELECT COUNT(*) 
                FROM nominations 
                WHERE bulk_upload_batch_id = NEW.bulk_upload_batch_id 
                AND is_draft = TRUE
            ),
            updated_at = NOW()
        WHERE id = NEW.bulk_upload_batch_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if nominations are open
CREATE OR REPLACE FUNCTION are_nominations_open()
RETURNS BOOLEAN AS $$
DECLARE
    deadline_setting TEXT;
    open_setting TEXT;
    deadline_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT setting_value INTO open_setting 
    FROM app_settings 
    WHERE setting_key = 'nominations_open' AND is_active = TRUE;
    
    SELECT setting_value INTO deadline_setting 
    FROM app_settings 
    WHERE setting_key = 'nomination_deadline' AND is_active = TRUE;
    
    IF open_setting = 'false' THEN
        RETURN FALSE;
    END IF;
    
    IF deadline_setting IS NOT NULL AND deadline_setting != '' THEN
        deadline_date := deadline_setting::TIMESTAMP WITH TIME ZONE;
        IF NOW() > deadline_date THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get bulk upload statistics
CREATE OR REPLACE FUNCTION get_bulk_upload_stats()
RETURNS TABLE (
    total_batches BIGINT,
    total_nominees_uploaded BIGINT,
    pending_approval BIGINT,
    approved_bulk BIGINT,
    rejected_bulk BIGINT,
    draft_nominees BIGINT,
    failed_uploads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM bulk_upload_batches)::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND state = 'pending' AND is_draft = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND state = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND state = 'rejected')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND is_draft = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND bulk_upload_errors IS NOT NULL)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Function to approve bulk nominees
CREATE OR REPLACE FUNCTION approve_bulk_nominees(nominee_ids UUID[], approved_by_user VARCHAR(100))
RETURNS TABLE (
    approved_count INTEGER,
    failed_count INTEGER,
    error_details TEXT[]
) AS $$
DECLARE
    approved_cnt INTEGER := 0;
    failed_cnt INTEGER := 0;
    errors TEXT[] := ARRAY[]::TEXT[];
    nominee_id UUID;
BEGIN
    FOREACH nominee_id IN ARRAY nominee_ids
    LOOP
        BEGIN
            UPDATE nominations 
            SET 
                state = 'approved',
                is_draft = FALSE,
                approved_at = NOW(),
                approved_by = approved_by_user,
                updated_at = NOW()
            WHERE id = nominee_id 
            AND upload_source = 'bulk_upload' 
            AND is_draft = TRUE 
            AND state = 'pending';
            
            IF FOUND THEN
                approved_cnt := approved_cnt + 1;
            ELSE
                failed_cnt := failed_cnt + 1;
                errors := array_append(errors, 'Nominee ' || nominee_id || ' not found or not eligible for approval');
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            failed_cnt := failed_cnt + 1;
            errors := array_append(errors, 'Error approving nominee ' || nominee_id || ': ' || SQLERRM);
        END;
    END LOOP;
    
    RETURN QUERY SELECT approved_cnt, failed_cnt, errors;
END;
$$ LANGUAGE plpgsql;

-- Function to update app setting
CREATE OR REPLACE FUNCTION update_app_setting(
    p_setting_key VARCHAR(100),
    p_setting_value TEXT,
    p_updated_by VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE app_settings 
    SET 
        setting_value = p_setting_value,
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE setting_key = p_setting_key;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: CREATE TRIGGERS
-- =====================================================

-- Create trigger for bulk batch stats
DROP TRIGGER IF EXISTS trigger_update_bulk_batch_stats ON nominations;
CREATE TRIGGER trigger_update_bulk_batch_stats
    AFTER INSERT OR UPDATE ON nominations
    FOR EACH ROW
    WHEN (NEW.bulk_upload_batch_id IS NOT NULL)
    EXECUTE FUNCTION update_bulk_batch_stats();

-- =====================================================
-- STEP 9: CREATE VIEWS
-- =====================================================

-- View for bulk upload dashboard
CREATE OR REPLACE VIEW admin_bulk_upload_dashboard AS
SELECT
    b.id as batch_id,
    b.filename,
    b.total_rows,
    b.processed_rows,
    b.successful_rows,
    b.failed_rows,
    b.draft_rows,
    b.status,
    b.uploaded_by,
    b.uploaded_at,
    b.completed_at,
    b.error_summary,
    
    CASE 
        WHEN b.total_rows > 0 THEN ROUND((b.processed_rows::DECIMAL / b.total_rows) * 100, 2)
        ELSE 0 
    END as processing_percentage,
    
    CASE 
        WHEN b.processed_rows > 0 THEN ROUND((b.successful_rows::DECIMAL / b.processed_rows) * 100, 2)
        ELSE 0 
    END as success_percentage,
    
    (SELECT COUNT(*) 
     FROM nominations n 
     WHERE n.bulk_upload_batch_id = b.id 
     AND n.is_draft = TRUE 
     AND n.state = 'pending'
    ) as pending_approvals,
    
    (SELECT COUNT(*) 
     FROM nominations n 
     WHERE n.bulk_upload_batch_id = b.id 
     AND n.state = 'approved'
    ) as approved_count
    
FROM bulk_upload_batches b
ORDER BY b.uploaded_at DESC;

-- View for bulk upload nominees pending approval
CREATE OR REPLACE VIEW admin_bulk_nominees_pending AS
SELECT
    n.id as nomination_id,
    n.bulk_upload_batch_id,
    n.bulk_upload_row_number,
    n.uploaded_by,
    n.uploaded_at,
    n.bulk_upload_errors,
    
    ne.type as nominee_type,
    CASE 
        WHEN ne.type = 'person' THEN COALESCE(ne.firstname, '') || ' ' || COALESCE(ne.lastname, '')
        ELSE COALESCE(ne.company_name, '')
    END AS nominee_display_name,
    
    CASE 
        WHEN ne.type = 'person' THEN ne.person_email
        ELSE ne.company_email
    END AS nominee_email,
    
    CASE 
        WHEN ne.type = 'person' THEN ne.headshot_url
        ELSE ne.logo_url
    END AS nominee_image_url,
    
    n.subcategory_id,
    n.category_group_id,
    
    b.filename as batch_filename,
    b.status as batch_status
    
FROM nominations n
JOIN nominees ne ON n.nominee_id = ne.id
JOIN bulk_upload_batches b ON n.bulk_upload_batch_id = b.id
WHERE n.upload_source = 'bulk_upload' 
AND n.is_draft = TRUE 
AND n.state = 'pending'
ORDER BY n.uploaded_at DESC, n.bulk_upload_row_number ASC;

-- =====================================================
-- STEP 10: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT SELECT ON admin_bulk_upload_dashboard TO service_role;
GRANT SELECT ON admin_bulk_nominees_pending TO service_role;
GRANT ALL ON bulk_upload_batches TO service_role;
GRANT ALL ON bulk_upload_errors TO service_role;
GRANT ALL ON app_settings TO service_role;
GRANT ALL ON loops_sync_queue TO service_role;
GRANT EXECUTE ON FUNCTION get_bulk_upload_stats() TO service_role;
GRANT EXECUTE ON FUNCTION approve_bulk_nominees(UUID[], VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION are_nominations_open() TO service_role;
GRANT EXECUTE ON FUNCTION update_app_setting(VARCHAR, TEXT, VARCHAR) TO service_role;

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== SAFE BULK UPLOAD MIGRATION COMPLETE ===';
  RAISE NOTICE 'All tables, columns, and functions have been safely added';
  RAISE NOTICE 'Existing data has been preserved';
  RAISE NOTICE 'Ready for bulk upload functionality!';
END $$;