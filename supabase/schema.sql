-- WSA 2026 Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE nomination_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE nomination_type AS ENUM ('person', 'company');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');
CREATE TYPE outbox_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE outbox_operation AS ENUM ('create', 'update', 'delete');
CREATE TYPE entity_type AS ENUM ('nomination', 'vote');

-- Nominations table
CREATE TABLE nominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    type nomination_type NOT NULL,
    nominee_data JSONB NOT NULL,
    company_data JSONB, -- Only for person nominations
    nominator_data JSONB NOT NULL,
    why_nominated TEXT NOT NULL,
    why_vote_for_me TEXT,
    live_url TEXT,
    status nomination_status DEFAULT 'pending',
    unique_key TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    moderated_at TIMESTAMPTZ,
    moderator_note TEXT,
    sync_status sync_status DEFAULT 'pending',
    sync_error TEXT,
    synced_at TIMESTAMPTZ
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nominee_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    voter_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    sync_status sync_status DEFAULT 'pending',
    sync_error TEXT,
    synced_at TIMESTAMPTZ
);

-- Sync outbox table for reliable external integrations
CREATE TABLE sync_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    operation outbox_operation NOT NULL,
    payload JSONB NOT NULL,
    status outbox_status DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_nominations_category ON nominations(category);
CREATE INDEX idx_nominations_type ON nominations(type);
CREATE INDEX idx_nominations_status ON nominations(status);
CREATE INDEX idx_nominations_unique_key ON nominations(unique_key);
CREATE INDEX idx_nominations_sync_status ON nominations(sync_status);
CREATE INDEX idx_nominations_created_at ON nominations(created_at);

CREATE INDEX idx_votes_nominee_id ON votes(nominee_id);
CREATE INDEX idx_votes_category ON votes(category);
CREATE INDEX idx_votes_sync_status ON votes(sync_status);
CREATE INDEX idx_votes_created_at ON votes(created_at);

CREATE INDEX idx_sync_outbox_status ON sync_outbox(status);
CREATE INDEX idx_sync_outbox_entity ON sync_outbox(entity_type, entity_id);
CREATE INDEX idx_sync_outbox_created_at ON sync_outbox(created_at);

-- Unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX idx_votes_unique ON votes(nominee_id, (voter_data->>'email'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nominations_updated_at 
    BEFORE UPDATE ON nominations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Enable but allow all for service role
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_outbox ENABLE ROW LEVEL SECURITY;

-- Policies (service role bypasses RLS, but good to have for future)
CREATE POLICY "Allow all operations for service role" ON nominations
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON votes
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for service role" ON sync_outbox
    FOR ALL USING (true);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_nomination_with_vote_count(nomination_id UUID)
RETURNS TABLE (
    nomination JSONB,
    vote_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(n.*) as nomination,
        COUNT(v.id) as vote_count
    FROM nominations n
    LEFT JOIN votes v ON n.id = v.nominee_id
    WHERE n.id = nomination_id
    GROUP BY n.id;
END;
$$ LANGUAGE plpgsql;

-- Function to add to sync outbox
CREATE OR REPLACE FUNCTION add_to_sync_outbox(
    p_entity_type entity_type,
    p_entity_id UUID,
    p_operation outbox_operation,
    p_payload JSONB
) RETURNS UUID AS $$
DECLARE
    outbox_id UUID;
BEGIN
    INSERT INTO sync_outbox (entity_type, entity_id, operation, payload)
    VALUES (p_entity_type, p_entity_id, p_operation, p_payload)
    RETURNING id INTO outbox_id;
    
    RETURN outbox_id;
END;
$$ LANGUAGE plpgsql;