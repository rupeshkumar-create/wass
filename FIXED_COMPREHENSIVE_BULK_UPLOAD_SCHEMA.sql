-- FIXED Comprehensive Bulk Upload and Nomination Deadline Schema Update
-- World Staffing Awards - Enhanced Admin Features
-- This version fixes the app_settings table creation issue

-- =====================================================
-- 1. BULK UPLOAD FUNCTIONALITY WITH DRAFT MODE
-- =====================================================

-- Add bulk upload tracking fields to nominations table
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS upload_source VARCHAR(20) DEFAULT 'form' CHECK (upload_source IN ('form', 'bulk_upload')),
ADD COLUMN IF NOT EXISTS bulk_upload_batch_id UUID,
ADD COLUMN IF NOT EXISTS bulk_upload_row_number INTEGER,
ADD COLUMN IF NOT EXISTS bulk_upload_errors TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Create bulk upload batches table
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
    csv_headers JSONB, -- Store original CSV headers
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bulk upload errors table for detailed error tracking
CREATE TABLE IF NOT EXISTS bulk_upload_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES bulk_upload_batches(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    error_message TEXT NOT NULL,
    error_type VARCHAR(50) DEFAULT 'validation', -- validation, duplicate, missing_required
    raw_data JSONB,
    suggested_fix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. NOMINATION DEADLINE MANAGEMENT
-- =====================================================

-- Create settings table for global application settings (FIXED VERSION)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, boolean, date, number, json
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default nomination deadline settings (FIXED VERSION)
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, created_by)
VALUES 
    ('nomination_deadline', NULL, 'date', 'Deadline for accepting new nominations', 'system'),
    ('nominations_open', 'true', 'boolean', 'Whether nominations are currently open', 'system'),
    ('voting_only_mode', 'false', 'boolean', 'Whether only voting is allowed (nominations closed)', 'system'),
    ('bulk_upload_enabled', 'true', 'boolean', 'Whether bulk upload feature is enabled', 'system'),
    ('auto_approve_bulk_uploads', 'false', 'boolean', 'Whether to auto-approve bulk uploaded nominees', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 3. ENHANCED LOOPS INTEGRATION FOR BULK UPLOADS
-- =====================================================

-- Add loops sync fields for bulk uploads
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS loops_contact_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS loops_sync_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS loops_sync_error TEXT,
ADD COLUMN IF NOT EXISTS loops_last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_to_loops_on_approval BOOLEAN DEFAULT TRUE;

-- Create loops sync queue for batch processing
CREATE TABLE IF NOT EXISTS loops_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_id UUID REFERENCES nominations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'approve', 'bulk_approve'
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    payload JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, retrying
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Bulk upload indexes
CREATE INDEX IF NOT EXISTS idx_nominations_upload_source ON nominations(upload_source);
CREATE INDEX IF NOT EXISTS idx_nominations_bulk_batch ON nominations(bulk_upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_nominations_is_draft ON nominations(is_draft);
CREATE INDEX IF NOT EXISTS idx_nominations_uploaded_by ON nominations(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_status ON bulk_upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_uploaded_by ON bulk_upload_batches(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bulk_errors_batch ON bulk_upload_errors(batch_id);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_active ON app_settings(is_active);

-- Loops sync indexes
CREATE INDEX IF NOT EXISTS idx_nominations_loops_sync_status ON nominations(loops_sync_status);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_status ON loops_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_scheduled ON loops_sync_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_loops_sync_queue_priority ON loops_sync_queue(priority, scheduled_for);

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
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

-- Create trigger for bulk batch stats
DROP TRIGGER IF EXISTS trigger_update_bulk_batch_stats ON nominations;
CREATE TRIGGER trigger_update_bulk_batch_stats
    AFTER INSERT OR UPDATE ON nominations
    FOR EACH ROW
    WHEN (NEW.bulk_upload_batch_id IS NOT NULL)
    EXECUTE FUNCTION update_bulk_batch_stats();

-- Function to queue loops sync when nomination is approved
CREATE OR REPLACE FUNCTION queue_loops_sync_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If nomination was just approved and should sync to loops
    IF OLD.state != 'approved' AND NEW.state = 'approved' AND NEW.sync_to_loops_on_approval = TRUE THEN
        INSERT INTO loops_sync_queue (nomination_id, sync_type, priority, payload)
        VALUES (
            NEW.id, 
            CASE WHEN NEW.upload_source = 'bulk_upload' THEN 'bulk_approve' ELSE 'approve' END,
            CASE WHEN NEW.upload_source = 'bulk_upload' THEN 3 ELSE 1 END, -- Higher priority for individual approvals
            jsonb_build_object(
                'nomination_id', NEW.id,
                'upload_source', NEW.upload_source,
                'batch_id', NEW.bulk_upload_batch_id
            )
        );
        
        -- Update loops sync status
        NEW.loops_sync_status = 'queued';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loops sync queueing
DROP TRIGGER IF EXISTS trigger_queue_loops_sync ON nominations;
CREATE TRIGGER trigger_queue_loops_sync
    BEFORE UPDATE ON nominations
    FOR EACH ROW
    EXECUTE FUNCTION queue_loops_sync_on_approval();

-- Function to check if nominations are open
CREATE OR REPLACE FUNCTION are_nominations_open()
RETURNS BOOLEAN AS $$
DECLARE
    deadline_setting TEXT;
    open_setting TEXT;
    deadline_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get settings
    SELECT setting_value INTO open_setting 
    FROM app_settings 
    WHERE setting_key = 'nominations_open' AND is_active = TRUE;
    
    SELECT setting_value INTO deadline_setting 
    FROM app_settings 
    WHERE setting_key = 'nomination_deadline' AND is_active = TRUE;
    
    -- If nominations are explicitly closed
    IF open_setting = 'false' THEN
        RETURN FALSE;
    END IF;
    
    -- If there's a deadline, check if it's passed
    IF deadline_setting IS NOT NULL AND deadline_setting != '' THEN
        deadline_date := deadline_setting::TIMESTAMP WITH TIME ZONE;
        IF NOW() > deadline_date THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ADMIN VIEWS FOR BULK UPLOAD MANAGEMENT
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
    
    -- Calculate percentages
    CASE 
        WHEN b.total_rows > 0 THEN ROUND((b.processed_rows::DECIMAL / b.total_rows) * 100, 2)
        ELSE 0 
    END as processing_percentage,
    
    CASE 
        WHEN b.processed_rows > 0 THEN ROUND((b.successful_rows::DECIMAL / b.processed_rows) * 100, 2)
        ELSE 0 
    END as success_percentage,
    
    -- Count of pending approvals from this batch
    (SELECT COUNT(*) 
     FROM nominations n 
     WHERE n.bulk_upload_batch_id = b.id 
     AND n.is_draft = TRUE 
     AND n.state = 'pending'
    ) as pending_approvals,
    
    -- Count of approved from this batch
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
    
    -- Nominee details
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
    
    -- Batch info
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
-- 7. UTILITY FUNCTIONS
-- =====================================================

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

-- Function to approve bulk nominees in batch
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
-- 8. PERMISSIONS AND SECURITY
-- =====================================================

-- Grant permissions for admin views
GRANT SELECT ON admin_bulk_upload_dashboard TO service_role;
GRANT SELECT ON admin_bulk_nominees_pending TO service_role;

-- Grant permissions for tables
GRANT ALL ON bulk_upload_batches TO service_role;
GRANT ALL ON bulk_upload_errors TO service_role;
GRANT ALL ON app_settings TO service_role;
GRANT ALL ON loops_sync_queue TO service_role;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION get_bulk_upload_stats() TO service_role;
GRANT EXECUTE ON FUNCTION approve_bulk_nominees(UUID[], VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION are_nominations_open() TO service_role;
GRANT EXECUTE ON FUNCTION update_app_setting(VARCHAR, TEXT, VARCHAR) TO service_role;

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE bulk_upload_batches IS 'Tracks bulk upload operations and their processing status';
COMMENT ON TABLE bulk_upload_errors IS 'Stores detailed error information for failed bulk upload rows';
COMMENT ON TABLE app_settings IS 'Global application settings including nomination deadlines';
COMMENT ON TABLE loops_sync_queue IS 'Queue for processing Loops.so synchronization tasks';

COMMENT ON COLUMN nominations.upload_source IS 'Indicates whether nomination came from form or bulk upload';
COMMENT ON COLUMN nominations.is_draft IS 'TRUE for bulk uploaded nominees awaiting manual approval';
COMMENT ON COLUMN nominations.sync_to_loops_on_approval IS 'Whether to sync to Loops when approved';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '=== FIXED COMPREHENSIVE BULK UPLOAD AND DEADLINE SCHEMA COMPLETE ===';
  RAISE NOTICE 'Features added:';
  RAISE NOTICE '✓ Bulk upload with draft mode and manual approval';
  RAISE NOTICE '✓ Nomination deadline management';
  RAISE NOTICE '✓ Enhanced Loops integration for bulk uploads';
  RAISE NOTICE '✓ Admin dashboard views for bulk management';
  RAISE NOTICE '✓ Batch approval functions';
  RAISE NOTICE '✓ Settings management system';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: app_settings table creation issue resolved';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Use the enhanced bulk upload API endpoints';
  RAISE NOTICE '2. Integrate admin UI components';
  RAISE NOTICE '3. Test CSV parsing and validation';
  RAISE NOTICE '4. Configure Loops sync processing';
END $$;