export type Category = 'coffee' | 'tea' | 'smoothie' | 'food' | 'bakery'

export interface MenuItem {
  id: string
  name: string
  category: Category
  price: number
  description: string
  emoji: string
  available: boolean
}

export interface OrderItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface Order {
  id: string
  orderNumber: number
  items: OrderItem[]
  status: OrderStatus
  tableNumber?: number
  customerName?: string
  createdAt: Date
  completedAt?: Date
  total: number
  discount: number
  tax: number
  paymentMethod?: 'cash' | 'card' | 'qr'
  memberId?: string
  memberDiscount: number
}

export interface Member {
  id: string
  name: string
  phone: string
  email?: string
  joinedAt: Date
  totalSpent: number
  totalOrders: number
}

export type Page = 'order' | 'manage' | 'menu' | 'summary' | 'members' | 'settings'

export type Role = 'cashier' | 'manager'

export interface AuthUser {
  id: string
  name: string
  role: Role
}

export interface StaffAccount {
  id: string
  name: string
  role: Role
  active: boolean
  createdAt: Date
}
