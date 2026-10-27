-- V4__admin_system_and_roles.sql
INSERT INTO roles (id, version, deleted_flag, name, description)
VALUES ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', 0, FALSE, 'ADMIN', 'System Administrator with user management, security monitoring, and auditing authority')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, version, deleted_flag, name, description)
VALUES
    ('22222222-2222-2222-2222-222222222201', 0, FALSE, 'ADMIN_DASHBOARD', 'Access administrative analytics and metrics'),
    ('22222222-2222-2222-2222-222222222202', 0, FALSE, 'USER_MANAGE', 'View, activate, suspend, and manage users'),
    ('22222222-2222-2222-2222-222222222203', 0, FALSE, 'ROLE_MANAGE', 'Assign and revoke system roles'),
    ('22222222-2222-2222-2222-222222222204', 0, FALSE, 'SECURITY_AUDIT', 'Monitor security events and audit trails'),
    ('22222222-2222-2222-2222-222222222205', 0, FALSE, 'SYSTEM_HEALTH', 'Inspect application and service health metrics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111101'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111102'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111103'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '11111111-1111-1111-1111-111111111104'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '22222222-2222-2222-2222-222222222201'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '22222222-2222-2222-2222-222222222202'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '22222222-2222-2222-2222-222222222203'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '22222222-2222-2222-2222-222222222204'),
    ('a1b2c3d4-e5f6-4a1b-8c2d-9e0f1a2b3c4d', '22222222-2222-2222-2222-222222222205')
ON CONFLICT DO NOTHING;
