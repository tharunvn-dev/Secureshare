-- V6__secure_storage_enhancements.sql
-- Adds wrapped key support for shared links and email outbox delivery tracking

ALTER TABLE shared_links 
ADD COLUMN IF NOT EXISTS wrapped_key_envelope BYTEA,
ADD COLUMN IF NOT EXISTS hkdf_salt BYTEA;

CREATE TABLE IF NOT EXISTS email_outbox (
    id UUID PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created ON email_outbox(created_at);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
