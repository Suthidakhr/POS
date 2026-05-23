import { useState, useCallback } from 'react'
import { Order, OrderItem, OrderStatus, Page, MenuItem, Member } from './types'
import { menuItems } from './data/menu'
import Sidebar from './components/Sidebar'
import OrderPage from './components/OrderPage'
import ManageOrderPage from './components/ManageOrderPage'
import MenuManagePage from './components/MenuManagePage'
import SummaryPage from './components/SummaryPage'
import MembershipPage from './components/MembershipPage'

let orderCounter = 5

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_MEMBERS: Member[] = [
  { id: 'mb1', name: 'Suthida K.',   phone: '0812345678', email: 'suthida@email.com',  joinedAt: new Date('2026-03-15'), totalOrders: 1, totalSpent: 226 },
  { id: 'mb2', name: 'Thanakorn P.', phone: '0898765432',                               joinedAt: new Date('2026-04-02'), totalOrders: 1, totalSpent: 303 },
  { id: 'mb3', name: 'Maneerat W.',  phone: '0861234567', email: 'maneerat@email.com', joinedAt: new Date('2026-05-10'), totalOrders: 1, totalSpent: 260 },
]

const m = menuItems
const SEED_ORDERS: Order[] = [
  {
    id: 'o1', orderNumber: 1, status: 'completed', paymentMethod: 'cash',
    tableNumber: 3, customerName: 'Suthida K.', memberId: 'mb1',
    createdAt: new Date('2026-05-23T09:15:00'), completedAt: new Date('2026-05-23T09:38:00'),
    items: [
      { menuItem: m.find(x => x.id === 'c3')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'c4')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'b1')!, quantity: 1 },
    ],
    discount: 0, memberDiscount: 24, tax: 15, total: 226,
  },
  {
    id: 'o2', orderNumber: 2, status: 'ready', paymentMethod: 'card',
    tableNumber: 5, customerName: 'Thanakorn P.', memberId: 'mb2',
    createdAt: new Date('2026-05-23T10:22:00'),
    items: [
      { menuItem: m.find(x => x.id === 'c6')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'f1')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'b2')!, quantity: 1 },
    ],
    discount: 0, memberDiscount: 32, tax: 20, total: 303,
  },
  {
    id: 'o3', orderNumber: 3, status: 'preparing', paymentMethod: 'qr',
    tableNumber: 2, customerName: 'Maneerat W.', memberId: 'mb3',
    createdAt: new Date('2026-05-23T10:45:00'),
    items: [
      { menuItem: m.find(x => x.id === 't1')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 't3')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'f5')!, quantity: 1 },
    ],
    discount: 0, memberDiscount: 27, tax: 17, total: 260,
  },
  {
    id: 'o4', orderNumber: 4, status: 'pending', paymentMethod: 'cash',
    tableNumber: 1, customerName: 'Walk-in',
    createdAt: new Date('2026-05-23T11:02:00'),
    items: [
      { menuItem: m.find(x => x.id === 'c2')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'c8')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'b4')!, quantity: 1 },
      { menuItem: m.find(x => x.id === 'b5')!, quantity: 1 },
    ],
    discount: 0, memberDiscount: 0, tax: 23, total: 358,
  },
]
// ───────────────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function App() {
  const [page, setPage] = useState<Page>('order')
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS)
  const [cart, setCart] = useState<OrderItem[]>([])
  const [managedMenu, setManagedMenu] = useState<MenuItem[]>(menuItems)
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS)

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id)
      if (existing) return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }, [])

  const updateCartItem = useCallback((itemId: string, quantity: number, note?: string) => {
    setCart(prev => {
      if (quantity <= 0) return prev.filter(i => i.menuItem.id !== itemId)
      return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity, note: note ?? i.note } : i)
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const placeOrder = useCallback((
    items: OrderItem[],
    opts: { tableNumber?: number; customerName?: string; discount: number; paymentMethod: 'cash' | 'card' | 'qr'; memberId?: string; memberDiscount: number }
  ) => {
    const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)
    const totalDiscount = opts.discount + opts.memberDiscount
    const discounted = subtotal - totalDiscount
    const tax = Math.round(discounted * 0.07)
    const total = discounted + tax

    const order: Order = {
      id: generateId(),
      orderNumber: orderCounter++,
      items,
      status: 'pending',
      tableNumber: opts.tableNumber,
      customerName: opts.customerName,
      createdAt: new Date(),
      total,
      discount: opts.discount,
      memberDiscount: opts.memberDiscount,
      tax,
      paymentMethod: opts.paymentMethod,
      memberId: opts.memberId,
    }
    setOrders(prev => [order, ...prev])
    setCart([])

    if (opts.memberId) {
      setMembers(prev => prev.map(m =>
        m.id === opts.memberId
          ? { ...m, totalOrders: m.totalOrders + 1, totalSpent: m.totalSpent + total }
          : m
      ))
    }

    return order
  }, [])

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status, completedAt: status === 'completed' ? new Date() : o.completedAt }
        : o
    ))
  }, [])

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }, [])

  const updateMenuItem = useCallback((updated: MenuItem) => {
    setManagedMenu(prev => prev.map(m => m.id === updated.id ? updated : m))
  }, [])

  const addMenuItem = useCallback((item: MenuItem) => {
    setManagedMenu(prev => [...prev, item])
  }, [])

  const deleteMenuItem = useCallback((id: string) => {
    setManagedMenu(prev => prev.filter(m => m.id !== id))
  }, [])

  const addMember = useCallback((data: { name: string; phone: string; email?: string }) => {
    const member: Member = {
      ...data,
      id: generateId(),
      joinedAt: new Date(),
      totalSpent: 0,
      totalOrders: 0,
    }
    setMembers(prev => [member, ...prev])
    return member
  }, [])

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  const findMemberByPhone = useCallback((phone: string) => {
    return members.find(m => m.phone === phone.trim())
  }, [members])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar page={page} onNavigate={setPage} orders={orders} members={members} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'order' && (
          <OrderPage
            menuItems={managedMenu}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateCartItem={updateCartItem}
            onClearCart={clearCart}
            onPlaceOrder={placeOrder}
            onFindMember={findMemberByPhone}
          />
        )}
        {page === 'manage' && (
          <ManageOrderPage
            orders={orders}
            onUpdateStatus={updateOrderStatus}
            onDeleteOrder={deleteOrder}
          />
        )}
        {page === 'menu' && (
          <MenuManagePage
            menuItems={managedMenu}
            onUpdateItem={updateMenuItem}
            onAddItem={addMenuItem}
            onDeleteItem={deleteMenuItem}
          />
        )}
        {page === 'summary' && <SummaryPage orders={orders} />}
        {page === 'members' && (
          <MembershipPage
            members={members}
            onAddMember={addMember}
            onDeleteMember={deleteMember}
          />
        )}
      </main>
    </div>
  )
}
