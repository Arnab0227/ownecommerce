-- Create missing loyalty system tables

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired')),
    points INTEGER NOT NULL,
    description TEXT,
    order_id VARCHAR(100),
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty_points table for current balances
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    current_points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loyalty_rewards table for available rewards
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'discount', 'free_shipping', 'product'
    reward_value DECIMAL(10,2), -- discount amount or product value
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- Insert default loyalty rewards
INSERT INTO loyalty_rewards (name, description, points_required, reward_type, reward_value) VALUES
('5% Discount', 'Get 5% off on your next purchase', 500, 'discount', 5.00),
('10% Discount', 'Get 10% off on your next purchase', 1000, 'discount', 10.00),
('Free Shipping', 'Free shipping on your next order', 200, 'free_shipping', 0.00),
('15% Discount', 'Get 15% off on your next purchase', 1500, 'discount', 15.00),
('20% Discount', 'Get 20% off on your next purchase', 2000, 'discount', 20.00)
ON CONFLICT DO NOTHING;
