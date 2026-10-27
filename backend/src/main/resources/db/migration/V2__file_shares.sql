-- V2__file_shares.sql
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    file_id UUID NOT NULL REFERENCES stored_files(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    wrapped_key_envelope BYTEA NOT NULL,
    hkdf_salt BYTEA NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_owner ON file_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_recipient ON file_shares(recipient_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_status ON file_shares(status);

CREATE TABLE IF NOT EXISTS shared_links (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    file_id UUID NOT NULL REFERENCES stored_files(id) ON DELETE CASCADE,
    shared_by_id UUID NOT NULL REFERENCES users(id),
    recipient_email VARCHAR(255),
    access_token_hash VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_one_time BOOLEAN NOT NULL DEFAULT FALSE,
    access_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON shared_links(access_token_hash);
