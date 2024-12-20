-- Create first admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    INSERT INTO users (username, password, is_admin) 
    VALUES ('admin', '5dca0889c2f04a8c95c22f323fda74a00a6de7c1e0467c5c1d28627e239e3dd7f16f4d9f37010a46c9ce4854c17e001213e2e67800763bc64f42f1fc5add449e.f69525a0fed2b5c9bc3223a76fda7d1c', true);
  END IF;
END
$$;
