-- Create settings tables for the admin panel

-- Store settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL DEFAULT 'Golden Threads',
    store_description TEXT DEFAULT 'Premium traditional and modern clothing',
    store_email VARCHAR(255) DEFAULT 'info@goldenthreads.com',
    store_phone VARCHAR(50) DEFAULT '+91 9876543210',
    store_address TEXT DEFAULT '123 Fashion Street, Mumbai, Maharashtra 400001',
    currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    shipping_fee INTEGER DEFAULT 50,
    free_shipping_threshold INTEGER DEFAULT 999,
    privacy_policy_url TEXT DEFAULT '',
    terms_of_service_url TEXT DEFAULT '',
    data_deletion_url TEXT DEFAULT '',
    shipping_policy_url TEXT DEFAULT '',
    cancellation_refund_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT true,
    order_notifications BOOLEAN DEFAULT true,
    inventory_alerts BOOLEAN DEFAULT true,
    customer_notifications BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false;
    marketing_emails BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment settings table
CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    razorpay_enabled BOOLEAN DEFAULT true,
    cod_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
    id SERIAL PRIMARY KEY,
    query VARCHAR(255) NOT NULL,
    results_count INTEGER DEFAULT 0,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create missing stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id VARCHAR(100), -- order_id, adjustment_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Recent searches table
CREATE TABLE IF NOT EXISTS recent_searches (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    query VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, query)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Insert default settings if tables are empty
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO notification_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level)
SELECT id, stock, 0, 10 
FROM products 
WHERE id NOT IN (SELECT product_id FROM inventory WHERE product_id IS NOT NULL)
ON CONFLICT DO NOTHING;