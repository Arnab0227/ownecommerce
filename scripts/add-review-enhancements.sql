-- Add order_id to reviews table to track which order the review is for
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL;

-- Create review_images table for storing review images (up to 3 per review)
CREATE TABLE IF NOT EXISTS review_images (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add delivery_status to orders table to track delivered status
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending';

-- Create index for review images
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);

-- Create index for reviews by user and product (to check if user already reviewed)
CREATE INDEX IF NOT EXISTS idx_reviews_user_product ON reviews(user_id, product_id);

-- Create index for order delivery status
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
