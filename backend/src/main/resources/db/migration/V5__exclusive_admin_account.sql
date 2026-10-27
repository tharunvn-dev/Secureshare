-- V5__exclusive_admin_account.sql
-- Provisions the baseline admin identity if not already present
INSERT INTO users (id, version, deleted_flag, email, password_hash, first_name, last_name, status, mfa_enabled, created_at, updated_at)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    0,
    FALSE,
    'admin@gmail.com',
    '$2a$10$oAOjyoDiFR2iw.62iXUxduqvcjHbgtal7BfcePZZqDzDoWyLxPUQS', -- Default hash
    'System',
    'Administrator',
    'ACTIVE',
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d'
)
ON CONFLICT DO NOTHING;
