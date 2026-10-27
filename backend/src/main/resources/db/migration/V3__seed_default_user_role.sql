-- V3__seed_default_user_role.sql
INSERT INTO roles (id, version, deleted_flag, name, description)
VALUES ('b0c14a2d-0dd5-4f9f-9682-4d73f5395e39', 0, FALSE, 'USER', 'Default role for registered users')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, version, deleted_flag, name, description)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 0, FALSE, 'FILE_READ', 'Read and download authorized files'),
    ('11111111-1111-1111-1111-111111111102', 0, FALSE, 'FILE_WRITE', 'Upload and store encrypted files'),
    ('11111111-1111-1111-1111-111111111103', 0, FALSE, 'FILE_DELETE', 'Delete owned files'),
    ('11111111-1111-1111-1111-111111111104', 0, FALSE, 'FILE_SHARE', 'Share files and create key envelopes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('b0c14a2d-0dd5-4f9f-9682-4d73f5395e39', '11111111-1111-1111-1111-111111111101'),
    ('b0c14a2d-0dd5-4f9f-9682-4d73f5395e39', '11111111-1111-1111-1111-111111111102'),
    ('b0c14a2d-0dd5-4f9f-9682-4d73f5395e39', '11111111-1111-1111-1111-111111111103'),
    ('b0c14a2d-0dd5-4f9f-9682-4d73f5395e39', '11111111-1111-1111-1111-111111111104')
ON CONFLICT DO NOTHING;
