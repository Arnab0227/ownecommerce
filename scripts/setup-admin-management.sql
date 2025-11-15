-- Create admin_audit_log table to track all admin changes
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_user_email VARCHAR(255),
  reason TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';

-- Set both emails as admins if they exist
UPDATE users SET role = 'admin' WHERE email IN ('arnab0227@gmail.com', 'santanubhatta12@gmail.com');

-- Create users if they don't exist
INSERT INTO users (email, name, role)
VALUES 
  ('arnab0227@gmail.com', 'Arnab', 'admin'),
  ('santanubhatta12@gmail.com', 'Santanu', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
