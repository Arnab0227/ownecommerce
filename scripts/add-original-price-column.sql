-- Migration to add original_price column to products table
-- This script adds the missing original_price column that's causing the API errors

-- Add original_price column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'original_price'
    ) THEN
        ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2);
        
        -- Set original_price to current price for existing products where it's null
        UPDATE products SET original_price = price WHERE original_price IS NULL;
        
        -- Make original_price NOT NULL after setting values
        ALTER TABLE products ALTER COLUMN original_price SET NOT NULL;
        
        RAISE NOTICE 'Added original_price column to products table';
    ELSE
        RAISE NOTICE 'original_price column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'original_price';
