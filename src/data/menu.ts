import { MenuItem } from '../types'

export const menuItems: MenuItem[] = [
  // Coffee
  { id: 'c1', name: 'Espresso', category: 'coffee', price: 55, description: 'Rich single shot', emoji: '☕', available: true },
  { id: 'c2', name: 'Americano', category: 'coffee', price: 65, description: 'Espresso with hot water', emoji: '☕', available: true },
  { id: 'c3', name: 'Latte', category: 'coffee', price: 85, description: 'Espresso with steamed milk', emoji: '🥛', available: true },
  { id: 'c4', name: 'Cappuccino', category: 'coffee', price: 85, description: 'Espresso with foam', emoji: '☕', available: true },
  { id: 'c5', name: 'Flat White', category: 'coffee', price: 90, description: 'Double ristretto with milk', emoji: '☕', available: true },
  { id: 'c6', name: 'Cold Brew', category: 'coffee', price: 95, description: '12-hour cold extraction', emoji: '🧊', available: true },
  { id: 'c7', name: 'Matcha Latte', category: 'coffee', price: 95, description: 'Japanese matcha with milk', emoji: '🍵', available: true },
  { id: 'c8', name: 'Mocha', category: 'coffee', price: 95, description: 'Espresso with chocolate', emoji: '🍫', available: true },

  // Tea
  { id: 't1', name: 'Thai Milk Tea', category: 'tea', price: 75, description: 'Classic Thai tea blend', emoji: '🧋', available: true },
  { id: 't2', name: 'Chamomile', category: 'tea', price: 65, description: 'Calming herbal tea', emoji: '🌼', available: true },
  { id: 't3', name: 'Earl Grey', category: 'tea', price: 65, description: 'Bergamot black tea', emoji: '🫖', available: true },
  { id: 't4', name: 'Green Tea', category: 'tea', price: 60, description: 'Light Japanese green tea', emoji: '🍵', available: true },

  // Smoothie
  { id: 's1', name: 'Mango Smoothie', category: 'smoothie', price: 95, description: 'Fresh mango blend', emoji: '🥭', available: true },
  { id: 's2', name: 'Berry Blast', category: 'smoothie', price: 100, description: 'Mixed berry blend', emoji: '🫐', available: true },
  { id: 's3', name: 'Green Detox', category: 'smoothie', price: 110, description: 'Spinach, apple, ginger', emoji: '🥗', available: true },
  { id: 's4', name: 'Banana Oat', category: 'smoothie', price: 90, description: 'Banana with oat milk', emoji: '🍌', available: true },

  // Food
  { id: 'f1', name: 'Avocado Toast', category: 'food', price: 145, description: 'Sourdough with avocado', emoji: '🥑', available: true },
  { id: 'f2', name: 'Club Sandwich', category: 'food', price: 165, description: 'Triple-decker sandwich', emoji: '🥪', available: true },
  { id: 'f3', name: 'Caesar Salad', category: 'food', price: 155, description: 'Romaine, croutons, parmesan', emoji: '🥗', available: true },
  { id: 'f4', name: 'Egg Benedict', category: 'food', price: 185, description: 'Poached egg & hollandaise', emoji: '🍳', available: true },
  { id: 'f5', name: 'Granola Bowl', category: 'food', price: 130, description: 'Yogurt, granola, fruits', emoji: '🫙', available: true },

  // Bakery
  { id: 'b1', name: 'Croissant', category: 'bakery', price: 65, description: 'Buttery French pastry', emoji: '🥐', available: true },
  { id: 'b2', name: 'Blueberry Muffin', category: 'bakery', price: 75, description: 'Fresh baked daily', emoji: '🫐', available: true },
  { id: 'b3', name: 'Banana Bread', category: 'bakery', price: 70, description: 'Moist & sweet slice', emoji: '🍌', available: true },
  { id: 'b4', name: 'Cinnamon Roll', category: 'bakery', price: 85, description: 'Warm with cream cheese', emoji: '🌀', available: true },
  { id: 'b5', name: 'Lemon Tart', category: 'bakery', price: 90, description: 'Tangy pastry cream', emoji: '🍋', available: true },
]

export const categories: { id: string; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'tea', label: 'Tea', emoji: '🍵' },
  { id: 'smoothie', label: 'Smoothie', emoji: '🥤' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'bakery', label: 'Bakery', emoji: '🥐' },
]
