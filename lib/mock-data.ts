import type { Product } from "./types";

/**
 * Fallback catalogue shown when Supabase hasn't been configured yet
 * (see README for setup). Lets the storefront/admin UI be explored
 * immediately after `npm install && npm run dev`.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    name: "Wireless Earbuds Pro",
    description: "Noise-cancelling wireless earbuds with 24h battery life.",
    price: 249.99,
    category: "Electronics",
    image_url:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    stock_quantity: 18,
    low_stock_threshold: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    name: "Smart Fitness Band",
    description: "Track steps, heart rate, and sleep with a 10-day battery.",
    price: 189.5,
    category: "Electronics",
    image_url:
      "https://images.unsplash.com/photo-1575311373937-8f5d99c02c62?w=600&q=80",
    stock_quantity: 3,
    low_stock_threshold: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    name: "Bag of Rice (25kg)",
    description: "Premium long grain parboiled rice.",
    price: 320,
    category: "Groceries",
    image_url:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
    stock_quantity: 42,
    low_stock_threshold: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    name: "Cooking Oil (5L)",
    description: "Refined vegetable cooking oil.",
    price: 95,
    category: "Groceries",
    image_url:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
    stock_quantity: 8,
    low_stock_threshold: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    name: "Men's Casual Shirt",
    description: "Breathable cotton-blend shirt, available in multiple sizes.",
    price: 120,
    category: "Fashion",
    image_url:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80",
    stock_quantity: 25,
    low_stock_threshold: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    name: "Ladies' Sneakers",
    description: "Lightweight everyday sneakers with cushioned sole.",
    price: 210,
    category: "Fashion",
    image_url:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",
    stock_quantity: 4,
    low_stock_threshold: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111107",
    name: "Non-Stick Cooking Pot Set",
    description: "5-piece non-stick cookware set for everyday cooking.",
    price: 380,
    category: "Home & Living",
    image_url:
      "https://images.unsplash.com/photo-1585442520123-3b0f19d1f7a5?w=600&q=80",
    stock_quantity: 12,
    low_stock_threshold: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111108",
    name: "LED Desk Lamp",
    description: "Adjustable brightness desk lamp with USB charging port.",
    price: 75,
    category: "Home & Living",
    image_url:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    stock_quantity: 30,
    low_stock_threshold: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111109",
    name: "Shea Butter Body Lotion",
    description: "Moisturizing body lotion enriched with natural shea butter.",
    price: 45,
    category: "Beauty & Health",
    image_url:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    stock_quantity: 2,
    low_stock_threshold: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-111111111110",
    name: "A4 Exercise Books (Pack of 10)",
    description: "80-page ruled exercise books, pack of 10.",
    price: 38,
    category: "Stationery",
    image_url:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80",
    stock_quantity: 60,
    low_stock_threshold: 15,
    created_at: new Date().toISOString(),
  },
];
