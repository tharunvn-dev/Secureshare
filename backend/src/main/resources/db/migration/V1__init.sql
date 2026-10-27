-- V1__init.sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    public_key_ecc TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    original_size BIGINT NOT NULL,
    encrypted_size BIGINT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    storage_provider_id VARCHAR(100) NOT NULL,
    crypto_profile_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON stored_files(owner_id);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS otp_sessions (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    version BIGINT DEFAULT 0,
    deleted_flag BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON refresh_tokens(user_id);
