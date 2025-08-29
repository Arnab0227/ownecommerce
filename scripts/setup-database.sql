-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  firebase_uid VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table with model_no field
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  stock_quantity INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sku VARCHAR(100) UNIQUE,
  material VARCHAR(255),
  care_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || (RANDOM() * 1000)::int,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address_id INTEGER REFERENCES user_addresses(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(100) DEFAULT 'cod',
    payment_status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cart table for persistent cart storage
DROP TABLE IF EXISTS cart CASCADE;
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street VARCHAR(500) NOT NULL,
    address_line_2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(500) NOT NULL,
    address_line_2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_varchar ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id_varchar ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_varchar ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_varchar ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id_varchar ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_varchar ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_searches_user_created ON recent_searches(user_id, created_at DESC);



-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Men', 'men', 'Men''s clothing and accessories'),
('Women', 'women', 'Women''s clothing and accessories'),
('Kids', 'kids', 'Children''s clothing and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products with model numbers
INSERT INTO products (name, sku, description, price, original_price, category, stock_quantity, image_url) VALUES
('Elegant Silk Saree', 'GT-WOM-SAR-001', 'Beautiful handwoven silk saree with traditional patterns', 8999.00, 12999.00, 'women', 15, '/placeholder.svg?height=400&width=300&text=Silk+Saree'),
('Designer Kurti Set', 'GT-WOM-KUR-001', 'Premium cotton kurti with matching dupatta', 2499.00, 3499.00, 'women', 25, '/placeholder.svg?height=400&width=300&text=Kurti+Set'),
('Traditional Lehenga', 'GT-WOM-LEH-001', 'Stunning lehenga for weddings and festivals', 15999.00, 19999.00, 'women', 8, '/placeholder.svg?height=400&width=300&text=Lehenga'),
('Cotton Salwar Suit', 'GT-WOM-SAL-001', 'Comfortable cotton salwar suit for daily wear', 1999.00, 2799.00, 'women', 18, '/placeholder.svg?height=400&width=300&text=Salwar+Suit'),
('Formal Shirt', 'GT-MEN-SHI-001', 'Premium cotton formal shirt for office wear', 1299.00, 1799.00, 'men', 30, '/placeholder.svg?height=400&width=300&text=Formal+Shirt'),
('Casual T-Shirt', 'GT-MEN-TSH-001', 'Comfortable cotton t-shirt for casual wear', 599.00, 899.00, 'men', 50, '/placeholder.svg?height=400&width=300&text=T-Shirt'),
('Kids Party Dress', 'GT-KID-DRE-001', 'Adorable party dress for special occasions', 1899.00, 2499.00, 'kids', 20, '/placeholder.svg?height=400&width=300&text=Kids+Dress'),
('Kids Ethnic Wear', 'GT-KID-ETH-001', 'Comfortable ethnic wear for kids', 1299.00, 1699.00, 'kids', 30, '/placeholder.svg?height=400&width=300&text=Kids+Ethnic')
ON CONFLICT DO NOTHING;

INSERT INTO user_addresses (user_id, name, phone, street, city, state, pincode) VALUES 
('1', 'John Doe', '+91 9876543210', '123 Main Street, Apartment 4B', 'Mumbai', 'Maharashtra', '400001')
ON CONFLICT DO NOTHING;
INSERT INTO users (id, email, name, firebase_uid, role) VALUES 
(1, 'customer@example.com', 'John Doe', 'firebase_uid_123', 'user'),
(2, 'admin@goldenthreads.com', 'Admin User', 'firebase_uid_admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample address
INSERT INTO user_addresses (user_id, name, phone, street, city, state, pincode) VALUES 
('1', 'John Doe', '+91 9876543210', '123 Main Street, Apartment 4B', 'Mumbai', 'Maharashtra', '400001')
ON CONFLICT DO NOTHING;

-- Insert sample order with real data structure
INSERT INTO orders (
    order_number, user_id, email, address_id, status, total_amount, 
    payment_method, payment_status, razorpay_order_id, razorpay_payment_id, razorpay_signature
) VALUES (
    'ORD-2024-001', '1', 'customer@example.com', 1, 'confirmed', 2999.00,
    'razorpay', 'paid', 'order_razorpay_123456', 'pay_razorpay_789012', 'signature_abc123def456'
) ON CONFLICT (order_number) DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total) 
SELECT 1, p.id, p.name, 1, p.price, p.price 
FROM products p 
WHERE p.id = 1
ON CONFLICT DO NOTHING;

-- Insert another sample order for variety
INSERT INTO orders (
    order_number, user_id, email, address_id, status, total_amount, 
    payment_method, payment_status, created_at
) VALUES (
    'ORD-2024-002', '1', 'customer@example.com', 1, 'processing', 1599.00,
    'cod', 'pending', NOW() - INTERVAL '2 hours'
) ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total) 
SELECT 2, p.id, p.name, 1, p.price, p.price 
FROM products p 
WHERE p.id = 2