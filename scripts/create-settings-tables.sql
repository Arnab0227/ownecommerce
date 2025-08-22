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

-- Recent searches table
CREATE TABLE IF NOT EXISTS recent_searches (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    query VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, query)
);

-- Insert default settings if tables are empty
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO notification_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
