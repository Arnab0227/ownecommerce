-- Verify and ensure featured_collections column exists with correct data type
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured_collections TEXT DEFAULT '[]';

-- Create index for better performance when querying featured products
CREATE INDEX IF NOT EXISTS idx_products_featured_collections ON products(featured_collections);

-- Verify data integrity: Show products with featured collections
SELECT 
  id,
  name,
  featured_collections,
  category,
  created_at
FROM products
WHERE featured_collections != '[]'
ORDER BY created_at DESC;

-- Summary of featured collections usage
SELECT 
  CASE 
    WHEN featured_collections = '[]' THEN 'No collections'
    ELSE featured_collections
  END as collection_tag,
  COUNT(*) as product_count
FROM products
GROUP BY featured_collections
ORDER BY product_count DESC;
