-- +goose Up
SELECT 'up SQL query';
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_action_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_action_check CHECK (action IN ('view','create','update','delete','approve','post','override'));

-- +goose Down
SELECT 'down SQL query';
DELETE FROM member_role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE action = 'override');
DELETE FROM permissions WHERE action = 'override';
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_action_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_action_check CHECK (action IN ('view','create','update','delete','approve','post'));
