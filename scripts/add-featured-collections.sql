-- Add featured_collections column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured_collections TEXT DEFAULT '[]';

-- This will store a JSON array like: ["womens-hot-pick", "traditional-ethnic"]
-- Collections: womens-hot-pick, traditional-ethnic, childrens-premium, curated-casual
