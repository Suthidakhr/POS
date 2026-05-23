import { MenuItem, Member, Order, OrderItem, OrderStatus } from './types'

const BASE = '/api'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ─── MENU ────────────────────────────────────────────────────────────────────

export const fetchMenu = (): Promise<MenuItem[]> =>
  req('/menu')

export const createMenuItem = (item: Omit<MenuItem, 'id'>): Promise<MenuItem> =>
  req('/menu', { method: 'POST', body: JSON.stringify(item) })

export const updateMenuItem = (item: MenuItem): Promise<MenuItem> =>
  req(`/menu/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })

export const deleteMenuItem = (id: string): Promise<void> =>
  req(`/menu/${id}`, { method: 'DELETE' })

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

export const fetchMembers = (): Promise<Member[]> =>
  req('/members')

export const findMemberByPhone = async (phone: string): Promise<Member | undefined> => {
  try {
    return await req<Member>(`/members/phone/${encodeURIComponent(phone)}`)
  } catch {
    return undefined
  }
}

export const createMember = (data: { name: string; phone: string; email?: string }): Promise<Member> =>
  req('/members', { method: 'POST', body: JSON.stringify(data) })

export const deleteMember = (id: string): Promise<void> =>
  req(`/members/${id}`, { method: 'DELETE' })

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const fetchOrders = (): Promise<Order[]> =>
  req('/orders')

export const createOrder = (payload: {
  items: OrderItem[]
  tableNumber?: number
  customerName?: string
  discount: number
  memberDiscount: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'card' | 'qr'
  memberId?: string
}): Promise<Order> =>
  req('/orders', { method: 'POST', body: JSON.stringify(payload) })

export const updateOrderStatus = (id: string, status: OrderStatus): Promise<void> =>
  req(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })

export const deleteOrder = (id: string): Promise<void> =>
  req(`/orders/${id}`, { method: 'DELETE' })
