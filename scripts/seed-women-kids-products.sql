-- Insert women's products
INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_featured, sku, material, care_instructions) VALUES
('Floral Summer Dress', 'Beautiful floral print dress perfect for summer occasions.', 69.99, 'women', '/placeholder.svg?height=400&width=400', 25, true, 'WOM-DRE-001', '100% Viscose', 'Hand wash cold, hang dry'),
('Silk Blouse', 'Elegant silk blouse suitable for professional and casual wear.', 89.99, 'women', '/placeholder.svg?height=400&width=400', 20, true, 'WOM-BLO-001', '100% Silk', 'Dry clean only'),
('High-Waisted Jeans', 'Trendy high-waisted jeans with a flattering fit.', 75.99, 'women', '/placeholder.svg?height=400&width=400', 35, false, 'WOM-JEA-001', '98% Cotton, 2% Elastane', 'Machine wash cold, hang dry'),
('Cashmere Cardigan', 'Luxurious cashmere cardigan for layering.', 149.99, 'women', '/placeholder.svg?height=400&width=400', 15, true, 'WOM-CAR-001', '100% Cashmere', 'Hand wash cold, lay flat to dry'),
('Midi Skirt', 'Versatile midi skirt that can be styled for any occasion.', 49.99, 'women', '/placeholder.svg?height=400&width=400', 30, false, 'WOM-SKI-001', '95% Polyester, 5% Elastane', 'Machine wash cold, hang dry'),
('Wrap Top', 'Flattering wrap-style top in a comfortable fabric.', 39.99, 'women', '/placeholder.svg?height=400&width=400', 40, false, 'WOM-WRA-001', '95% Modal, 5% Elastane', 'Machine wash cold, tumble dry low'),
('Trench Coat', 'Classic trench coat perfect for transitional weather.', 179.99, 'women', '/placeholder.svg?height=400&width=400', 12, false, 'WOM-TRE-001', '100% Cotton', 'Dry clean only'),
('Yoga Leggings', 'High-performance leggings perfect for yoga and workouts.', 59.99, 'women', '/placeholder.svg?height=400&width=400', 50, false, 'WOM-YOG-001', '88% Polyester, 12% Elastane', 'Machine wash cold, hang dry'),
('Evening Gown', 'Elegant evening gown for special occasions.', 249.99, 'women', '/placeholder.svg?height=400&width=400', 8, false, 'WOM-EVE-001', '100% Polyester', 'Dry clean only'),
('Denim Jacket', 'Classic denim jacket that pairs well with any outfit.', 69.99, 'women', '/placeholder.svg?height=400&width=400', 25, false, 'WOM-DEN-001', '100% Cotton', 'Machine wash cold, tumble dry low');

-- Insert kids' products
INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_featured, sku, material, care_instructions) VALUES
('Rainbow T-Shirt', 'Colorful rainbow t-shirt that kids will love.', 19.99, 'kids', '/placeholder.svg?height=400&width=400', 60, true, 'KID-TSH-001', '100% Cotton', 'Machine wash warm, tumble dry low'),
('Dinosaur Hoodie', 'Fun dinosaur-themed hoodie perfect for playtime.', 34.99, 'kids', '/placeholder.svg?height=400&width=400', 45, true, 'KID-HOO-001', '80% Cotton, 20% Polyester', 'Machine wash cold, tumble dry low'),
('Denim Overalls', 'Adorable denim overalls for everyday adventures.', 42.99, 'kids', '/placeholder.svg?height=400&width=400', 30, false, 'KID-OVE-001', '100% Cotton', 'Machine wash cold, tumble dry low'),
('Princess Dress', 'Beautiful princess dress perfect for dress-up and special occasions.', 39.99, 'kids', '/placeholder.svg?height=400&width=400', 25, true, 'KID-PRI-001', '100% Polyester', 'Machine wash cold, hang dry'),
('Superhero Cape', 'Exciting superhero cape to spark imagination during play.', 24.99, 'kids', '/placeholder.svg?height=400&width=400', 40, false, 'KID-SUP-001', '100% Polyester', 'Machine wash cold, tumble dry low'),
('Striped Leggings', 'Comfortable striped leggings perfect for active kids.', 16.99, 'kids', '/placeholder.svg?height=400&width=400', 55, false, 'KID-LEG-001', '95% Cotton, 5% Elastane', 'Machine wash warm, tumble dry low'),
('Winter Jacket', 'Warm winter jacket to keep kids cozy during cold weather.', 79.99, 'kids', '/placeholder.svg?height=400&width=400', 20, false, 'KID-WIN-001', 'Outer: 100% Nylon, Lining: 100% Polyester', 'Machine wash cold, tumble dry low'),
('School Uniform Polo', 'Classic polo shirt perfect for school uniforms.', 22.99, 'kids', '/placeholder.svg?height=400&width=400', 50, false, 'KID-POL-001', '65% Polyester, 35% Cotton', 'Machine wash warm, tumble dry medium'),
('Pajama Set', 'Comfortable pajama set featuring fun animal prints.', 29.99, 'kids', '/placeholder.svg?height=400&width=400', 35, false, 'KID-PAJ-001', '100% Cotton', 'Machine wash warm, tumble dry low'),
('Rain Boots', 'Colorful rain boots perfect for puddle jumping.', 32.99, 'kids', '/placeholder.svg?height=400&width=400', 40, false, 'KID-RAI-001', '100% Rubber', 'Wipe clean with damp cloth');
