// src/api/mockData.ts

import type { Product } from './types'; // Import the Product type

// The 'products' array is now strongly typed as an array of Product objects.
// TypeScript will show an error if any object is missing a required property
// or has a property of the wrong type.
export const products: Product[] = [
  // Category 1: Electronics
  { id: 1, name: 'Quantum Smartphone', category: 'Electronics', price: 699.99, image: 'product-placeholder.webp' },
  { id: 2, name: 'Nova Laptop 15"', category: 'Electronics', price: 1299.00, image: 'product-placeholder.webp' },
  { id: 3, name: 'Aura Wireless Headphones', category: 'Electronics', price: 199.99, image: 'product-placeholder.webp' },
  { id: 4, name: 'Streamer 4K Webcam', category: 'Electronics', price: 89.50, image: 'product-placeholder.webp' },
  { id: 5, name: 'Compact Gaming Mouse', category: 'Electronics', price: 49.99, image: 'product-placeholder.webp' },

  // Category 2: Apparel
  { id: 6, name: 'Classic Denim Jacket', category: 'Apparel', price: 85.00, image: 'product-placeholder.webp' },
  { id: 7, name: 'Urban Graphic T-Shirt', category: 'Apparel', price: 24.99, image: 'product-placeholder.webp' },
  { id: 8, name: 'Performance Joggers', category: 'Apparel', price: 55.00, image: 'product-placeholder.webp' },
  { id: 9, name: 'Everyday Crew Socks (3-Pack)', category: 'Apparel', price: 15.00, image: 'product-placeholder.webp' },
  { id: 10, name: 'Minimalist Canvas Sneakers', category: 'Apparel', price: 75.00, image: 'product-placeholder.webp' },

  // Category 3: Books
  { id: 11, name: 'The Art of Code', category: 'Books', price: 32.99, image: 'product-placeholder.webp' },
  { id: 12, name: 'Digital Minimalism', category: 'Books', price: 18.00, image: 'product-placeholder.webp' },
  { id: 13, name: 'A Brief History of Time', category: 'Books', price: 15.99, image: 'product-placeholder.webp' },
  { id: 14, name: 'The Design of Everyday Things', category: 'Books', price: 20.50, image: 'product-placeholder.webp' },
  { id: 15, name: 'Sapiens: A Brief History of Humankind', category: 'Books', price: 22.00, image: 'product-placeholder.webp' },

  // Category 4: Home Goods
  { id: 16, name: 'Aromatic Coffee Brewer', category: 'Home Goods', price: 79.99, image: 'product-placeholder.webp' },
  { id: 17, name: 'Ergonomic Desk Chair', category: 'Home Goods', price: 250.00, image: 'product-placeholder.webp' },
  { id: 18, name: 'Smart LED Desk Lamp', category: 'Home Goods', price: 39.99, image: 'product-placeholder.webp' },
  { id: 19, name: 'Bamboo Cutting Board Set', category: 'Home Goods', price: 29.50, image: 'product-placeholder.webp' },
  { id: 20, name: 'Plush Throw Blanket', category: 'Home Goods', price: 45.00, image: 'product-placeholder.webp' },

  // Category 5: Sports & Outdoors
  { id: 21, name: 'Insulated Water Bottle', category: 'Sports & Outdoors', price: 25.00, image: 'product-placeholder.webp' },
  { id: 22, name: 'Pro-Grip Yoga Mat', category: 'Sports & Outdoors', price: 40.00, image: 'product-placeholder.webp' },
  { id: 23, name: 'Adjustable Dumbbell Set', category: 'Sports & Outdoors', price: 150.00, image: 'product-placeholder.webp' },
  { id: 24, name: 'Compact Camping Tent', category: 'Sports & Outdoors', price: 120.00, image: 'product-placeholder.webp' },
  { id: 25, name: 'Trail-Ready Hiking Backpack', category: 'Sports & Outdoors', price: 90.00, image: 'product-placeholder.webp' },

  // Category 6: Groceries
  { id: 26, name: 'Organic Colombian Coffee Beans', category: 'Groceries', price: 18.99, image: 'product-placeholder.webp' },
  { id: 27, name: 'Artisanal Sourdough Bread', category: 'Groceries', price: 6.50, image: 'product-placeholder.webp' },
  { id: 28, name: 'Extra Virgin Olive Oil', category: 'Groceries', price: 12.99, image: 'product-placeholder.webp' },
  { id: 29, name: 'Gourmet Chocolate Bar', category: 'Groceries', price: 4.99, image: 'product-placeholder.webp' },
  { id: 30, name: 'Fresh Avocado (Set of 3)', category: 'Groceries', price: 5.00, image: 'product-placeholder.webp' },
];