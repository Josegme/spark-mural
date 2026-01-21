-- Crear usuarios de prueba para Asistente y Salón
-- Los passwords serán: asistente123 y salon123 respectivamente

-- Usuario Asistente
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
)
VALUES (
  'aaaaaaaa-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'asistente@pickevent.com',
  crypt('asistente123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Juan Pérez Asistente"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Usuario Salón
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
)
VALUES (
  'bbbbbbbb-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'salon@pickevent.com',
  crypt('salon123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Salón Las Rosas"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Usuario Cliente de prueba
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
)
VALUES (
  'cccccccc-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'cliente@pickevent.com',
  crypt('cliente123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "María González"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
)
ON CONFLICT (id) DO NOTHING;