-- Create analytics tables for product view tracking and trending analysis

-- Table to store individual product view events
CREATE TABLE IF NOT EXISTS product_views (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Firebase UID for authenticated users
    session_id VARCHAR(255) NOT NULL,
    ip_address INET, -- For anonymous tracking
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_product_views_product_id (product_id),
    INDEX idx_product_views_user_id (user_id),
    INDEX idx_product_views_created_at (created_at),
    INDEX idx_product_views_ip (ip_address)
);

-- Table to store daily aggregated analytics data
CREATE TABLE IF NOT EXISTS product_analytics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_view_duration DECIMAL(10,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate daily records
    UNIQUE(product_id, date),
    
    -- Indexes
    INDEX idx_product_analytics_product_id (product_id),
    INDEX idx_product_analytics_date (date)
);

-- Table to store trending products calculations
CREATE TABLE IF NOT EXISTS trending_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    trending_score DECIMAL(10,4) DEFAULT 0,
    rank_position INTEGER,
    growth_rate DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for period calculations
    UNIQUE(product_id, period, period_start),
    
    -- Indexes
    INDEX idx_trending_products_period (period, period_start),
    INDEX idx_trending_products_score (trending_score DESC),
    INDEX idx_trending_products_rank (rank_position)
);

CREATE TABLE IF NOT EXISTS contact_queries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track email report deliveries
CREATE TABLE IF NOT EXISTS email_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index
    INDEX idx_email_reports_status (status),
    INDEX idx_email_reports_created_at (created_at)
);

-- Function to update product analytics daily
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO product_analytics (product_id, date, total_views, unique_views, unique_users, avg_view_duration)
    SELECT 
        pv.product_id,
        CURRENT_DATE - INTERVAL '1 day' as date,
        COUNT(*) as total_views,
        COUNT(DISTINCT COALESCE(pv.user_id, pv.ip_address::text)) as unique_views,
        COUNT(DISTINCT pv.user_id) FILTER (WHERE pv.user_id IS NOT NULL) as unique_users,
        AVG(pv.view_duration) as avg_view_duration
    FROM product_views pv
    WHERE DATE(pv.created_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY pv.product_id
    ON CONFLICT (product_id, date) 
    DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        unique_users = EXCLUDED.unique_users,
        avg_view_duration = EXCLUDED.avg_view_duration,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending products
CREATE OR REPLACE FUNCTION calculate_trending_products(period_type VARCHAR(20))
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
BEGIN
    -- Calculate date range based on period
    CASE period_type
        WHEN 'daily' THEN
            start_date := CURRENT_DATE - INTERVAL '1 day';
            end_date := CURRENT_DATE - INTERVAL '1 day';
        WHEN 'weekly' THEN
            start_date := CURRENT_DATE - INTERVAL '7 days';
            end_date := CURRENT_DATE - INTERVAL '1 day';
        WHEN 'monthly' THEN
            start_date := CURRENT_DATE - INTERVAL '30 days';
            end_date := CURRENT_DATE - INTERVAL '1 day';
    END CASE;
    
    -- Calculate and insert trending data
    WITH trending_calc AS (
        SELECT 
            p.id as product_id,
            COALESCE(SUM(pa.total_views), 0) as total_views,
            COALESCE(SUM(pa.unique_views), 0) as unique_views,
            COALESCE(COUNT(DISTINCT o.id), 0) as total_orders,
            COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
            -- Trending score calculation (views * 0.4 + unique_views * 0.3 + orders * 0.3)
            (COALESCE(SUM(pa.total_views), 0) * 0.4 + 
             COALESCE(SUM(pa.unique_views), 0) * 0.3 + 
             COALESCE(COUNT(DISTINCT o.id), 0) * 30) as trending_score
        FROM products p
        LEFT JOIN product_analytics pa ON p.id = pa.product_id 
            AND pa.date BETWEEN start_date AND end_date
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
            AND DATE(o.created_at) BETWEEN start_date AND end_date
        WHERE p.is_active = true
        GROUP BY p.id
        HAVING COALESCE(SUM(pa.total_views), 0) > 0
    ),
    ranked_trending AS (
        SELECT *,
            ROW_NUMBER() OVER (ORDER BY trending_score DESC) as rank_position
        FROM trending_calc
    )
    INSERT INTO trending_products (
        product_id, period, period_start, period_end, 
        total_views, unique_views, total_orders, revenue, 
        trending_score, rank_position
    )
    SELECT 
        product_id, period_type, start_date, end_date,
        total_views, unique_views, total_orders, revenue,
        trending_score, rank_position
    FROM ranked_trending
    ON CONFLICT (product_id, period, period_start)
    DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        total_orders = EXCLUDED.total_orders,
        revenue = EXCLUDED.revenue,
        trending_score = EXCLUDED.trending_score,
        rank_position = EXCLUDED.rank_position,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_contact_queries_status ON contact_queries(status);
CREATE INDEX IF NOT EXISTS idx_contact_queries_created_at ON contact_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);