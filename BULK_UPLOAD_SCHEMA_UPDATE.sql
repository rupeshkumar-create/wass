-- Bulk Upload Schema Update for World Staffing Awards
-- Adds support for bulk uploaded nominees with draft status

-- Add new status for bulk uploaded nominees
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS upload_source VARCHAR(20) DEFAULT 'form' CHECK (upload_source IN ('form', 'bulk_upload'));

-- Add bulk upload tracking fields
ALTER TABLE nominations 
ADD COLUMN IF NOT EXISTS bulk_upload_batch_id UUID,
ADD COLUMN IF NOT EXISTS bulk_upload_row_number INTEGER,
ADD COLUMN IF NOT EXISTS bulk_upload_errors TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create bulk upload batches table
CREATE TABLE IF NOT EXISTS bulk_upload_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_summary TEXT,
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
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nominations_upload_source ON nominations(upload_source);
CREATE INDEX IF NOT EXISTS idx_nominations_bulk_batch ON nominations(bulk_upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_status ON bulk_upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_uploaded_by ON bulk_upload_batches(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bulk_errors_batch ON bulk_upload_errors(batch_id);

-- Update the nominations status to include 'draft' for bulk uploads
-- Note: We'll use the existing 'pending' status but add upload_source to differentiate

-- Add trigger to update bulk batch statistics
CREATE OR REPLACE FUNCTION update_bulk_batch_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update batch statistics
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
            updated_at = NOW()
        WHERE id = NEW.bulk_upload_batch_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_bulk_batch_stats ON nominations;
CREATE TRIGGER trigger_update_bulk_batch_stats
    AFTER INSERT OR UPDATE ON nominations
    FOR EACH ROW
    WHEN (NEW.bulk_upload_batch_id IS NOT NULL)
    EXECUTE FUNCTION update_bulk_batch_stats();

-- Add function to get bulk upload statistics
CREATE OR REPLACE FUNCTION get_bulk_upload_stats()
RETURNS TABLE (
    total_batches BIGINT,
    total_nominees_uploaded BIGINT,
    pending_approval BIGINT,
    approved_bulk BIGINT,
    rejected_bulk BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM bulk_upload_batches)::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND status = 'pending')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM nominations WHERE upload_source = 'bulk_upload' AND status = 'rejected')::BIGINT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE bulk_upload_batches IS 'Tracks bulk upload operations and their status';
COMMENT ON TABLE bulk_upload_errors IS 'Stores detailed error information for failed bulk upload rows';
COMMENT ON COLUMN nominations.upload_source IS 'Indicates whether nomination came from form or bulk upload';
COMMENT ON COLUMN nominations.bulk_upload_batch_id IS 'Links to bulk upload batch if applicable';
COMMENT ON COLUMN nominations.bulk_upload_row_number IS 'Row number in the original CSV file';
COMMENT ON COLUMN nominations.bulk_upload_errors IS 'JSON string of validation errors for this row';