-- Clear existing products and insert women and kids garments with model numbers
DELETE FROM products;

-- Insert women's clothing
INSERT INTO products (name, sku, description, price, original_price, category, image_url, stock, rating) VALUES
-- Women's Dresses
('Floral Maxi Dress', 'WD001', 'Beautiful floral print maxi dress perfect for summer occasions', 2499, 3499, 'women-dresses', '/placeholder.svg?height=300&width=300', 25, 4.5),
('Little Black Dress', 'WD002', 'Classic black dress suitable for parties and formal events', 3299, 4299, 'women-dresses', '/placeholder.svg?height=300&width=300', 18, 4.7),
('Bohemian Midi Dress', 'WD003', 'Comfortable bohemian style midi dress with intricate patterns', 2199, 2999, 'women-dresses', '/placeholder.svg?height=300&width=300', 30, 4.3),
('Elegant Evening Gown', 'WD004', 'Stunning evening gown for special occasions and parties', 5999, 7999, 'women-dresses', '/placeholder.svg?height=300&width=300', 12, 4.8),

-- Women's Tops
('Silk Blouse', 'WT001', 'Premium silk blouse perfect for office and formal wear', 1899, 2499, 'women-tops', '/placeholder.svg?height=300&width=300', 35, 4.4),
('Cotton Crop Top', 'WT002', 'Comfortable cotton crop top for casual everyday wear', 899, 1299, 'women-tops', '/placeholder.svg?height=300&width=300', 50, 4.2),
('Designer Kurti', 'WT003', 'Traditional designer kurti with modern embroidery work', 1599, 2199, 'women-tops', '/placeholder.svg?height=300&width=300', 40, 4.6),
('Chiffon Shirt', 'WT004', 'Elegant chiffon shirt suitable for both casual and formal occasions', 1299, 1799, 'women-tops', '/placeholder.svg?height=300&width=300', 28, 4.1),

-- Women's Night Wear
('Cotton Nighty', 'WN001', 'Comfortable cotton nighty for peaceful sleep', 899, 1299, 'women-nightwear', '/placeholder.svg?height=300&width=300', 45, 4.3),
('Silk Night Suit', 'WN002', 'Luxurious silk night suit with elegant design', 1599, 2199, 'women-nightwear', '/placeholder.svg?height=300&width=300', 30, 4.5),
('Printed Nighty', 'WN003', 'Beautiful printed nighty with floral patterns', 699, 999, 'women-nightwear', '/placeholder.svg?height=300&width=300', 60, 4.2),
('Long Nighty', 'WN004', 'Full length comfortable nighty for all seasons', 1099, 1499, 'women-nightwear', '/placeholder.svg?height=300&width=300', 40, 4.4),

-- Women's Ethnic Wear
('Anarkali Suit Set', 'WE001', 'Beautiful Anarkali suit with dupatta and churidar', 3999, 5499, 'women-ethnic', '/placeholder.svg?height=300&width=300', 20, 4.7),
('Saree with Blouse', 'WE002', 'Elegant silk saree with matching designer blouse', 4599, 6299, 'women-ethnic', '/placeholder.svg?height=300&width=300', 15, 4.8),
('Lehenga Choli', 'WE003', 'Stunning lehenga choli perfect for weddings and festivals', 8999, 12999, 'women-ethnic', '/placeholder.svg?height=300&width=300', 8, 4.9),
('Palazzo Suit', 'WE004', 'Comfortable palazzo suit with printed dupatta', 2299, 3199, 'women-ethnic', '/placeholder.svg?height=300&width=300', 32, 4.3),

-- Women's Bottoms
('High Waist Jeans', 'WB001', 'Trendy high waist jeans with perfect fit', 2199, 2999, 'women-bottoms', '/placeholder.svg?height=300&width=300', 45, 4.4),
('Palazzo Pants', 'WB002', 'Flowy palazzo pants perfect for summer comfort', 1299, 1799, 'women-bottoms', '/placeholder.svg?height=300&width=300', 38, 4.2),
('Pencil Skirt', 'WB003', 'Professional pencil skirt for office wear', 1599, 2199, 'women-bottoms', '/placeholder.svg?height=300&width=300', 22, 4.5),
('Culottes', 'WB004', 'Stylish culottes for casual and semi-formal occasions', 1799, 2399, 'women-bottoms', '/placeholder.svg?height=300&width=300', 26, 4.1),

-- Kids Girls Clothing
('Princess Dress', 'KG001', 'Adorable princess dress for little girls (2-8 years)', 1299, 1799, 'kids-girls', '/placeholder.svg?height=300&width=300', 40, 4.6),
('Unicorn T-Shirt', 'KG002', 'Cute unicorn printed t-shirt for girls', 599, 899, 'kids-girls', '/placeholder.svg?height=300&width=300', 60, 4.4),
('Denim Dungaree', 'KG003', 'Stylish denim dungaree perfect for playtime', 1599, 2199, 'kids-girls', '/placeholder.svg?height=300&width=300', 35, 4.5),
('Floral Frock', 'KG004', 'Beautiful floral frock for special occasions', 999, 1399, 'kids-girls', '/placeholder.svg?height=300&width=300', 45, 4.3),
('Leggings Set', 'KG005', 'Comfortable leggings with matching top', 799, 1199, 'kids-girls', '/placeholder.svg?height=300&width=300', 55, 4.2),

-- Kids Boys Clothing
('Superhero T-Shirt', 'KB001', 'Cool superhero printed t-shirt for boys', 599, 899, 'kids-boys', '/placeholder.svg?height=300&width=300', 50, 4.4),
('Cargo Shorts', 'KB002', 'Comfortable cargo shorts perfect for active boys', 899, 1299, 'kids-boys', '/placeholder.svg?height=300&width=300', 42, 4.3),
('Polo Shirt', 'KB003', 'Smart polo shirt for semi-formal occasions', 799, 1199, 'kids-boys', '/placeholder.svg?height=300&width=300', 38, 4.1),
('Track Suit', 'KB004', 'Comfortable track suit for sports and casual wear', 1299, 1799, 'kids-boys', '/placeholder.svg?height=300&width=300', 30, 4.5),
('Formal Shirt', 'KB005', 'Crisp formal shirt for special events', 999, 1399, 'kids-boys', '/placeholder.svg?height=300&width=300', 25, 4.2),

-- Baby Clothing
('Onesie Set', 'BB001', 'Soft cotton onesie set for babies (0-12 months)', 699, 999, 'kids-baby', '/placeholder.svg?height=300&width=300', 70, 4.7),
('Baby Romper', 'BB002', 'Adorable romper with cute animal prints', 599, 849, 'kids-baby', '/placeholder.svg?height=300&width=300', 65, 4.6),
('Sleep Suit', 'BB003', 'Comfortable sleep suit for peaceful nights', 799, 1199, 'kids-baby', '/placeholder.svg?height=300&width=300', 50, 4.5),
('Baby Dress', 'BB004', 'Pretty dress for baby girls special occasions', 899, 1299, 'kids-baby', '/placeholder.svg?height=300&width=300', 40, 4.4),
('Bib and Burp Cloth Set', 'BB005', 'Essential bib and burp cloth set for feeding time', 399, 599, 'kids-baby', '/placeholder.svg?height=300&width=300', 80, 4.3);
