insert into public.products (name, description, price, category, image_url, stock_quantity, low_stock_threshold)
values
  ('Wireless Earbuds Pro', 'Noise-cancelling wireless earbuds with 24h battery life.', 249.99, 'Electronics', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80', 18, 5),
  ('Smart Fitness Band', 'Track steps, heart rate, and sleep with a 10-day battery.', 189.50, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 3, 5),
  ('Bag of Rice (25kg)', 'Premium long grain parboiled rice.', 320.00, 'Groceries', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', 42, 10),
  ('Cooking Oil (5L)', 'Refined vegetable cooking oil.', 95.00, 'Groceries', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', 8, 10),
  ('Men''s Casual Shirt', 'Breathable cotton-blend shirt, available in multiple sizes.', 120.00, 'Fashion', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80', 25, 8),
  ('Ladies'' Sneakers', 'Lightweight everyday sneakers with cushioned sole.', 210.00, 'Fashion', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80', 4, 5),
  ('Non-Stick Cooking Pot Set', '5-piece non-stick cookware set for everyday cooking.', 380.00, 'Home & Living', 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&q=80', 12, 4),
  ('LED Desk Lamp', 'Adjustable brightness desk lamp with USB charging port.', 75.00, 'Home & Living', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', 30, 10),
  ('Shea Butter Body Lotion', 'Moisturizing body lotion enriched with natural shea butter.', 45.00, 'Beauty & Health', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80', 2, 6),
  ('A4 Exercise Books (Pack of 10)', '80-page ruled exercise books, pack of 10.', 38.00, 'Stationery', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80', 60, 15)
on conflict do nothing;
