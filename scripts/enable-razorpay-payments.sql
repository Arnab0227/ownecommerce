-- Enable Razorpay payments in admin settings
UPDATE payment_settings 
SET razorpay_enabled = true, 
    updated_at = NOW() 
WHERE id = (SELECT id FROM payment_settings ORDER BY id DESC LIMIT 1);

-- If no payment settings exist, create them
INSERT INTO payment_settings (razorpay_enabled, cod_enabled) 
SELECT true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);
