import { useState, useCallback } from 'react'
import { Order, OrderItem, OrderStatus, Page, MenuItem, Member } from './types'
import { menuItems } from './data/menu'
import Sidebar from './components/Sidebar'
import OrderPage from './components/OrderPage'
import ManageOrderPage from './components/ManageOrderPage'
import MenuManagePage from './components/MenuManagePage'
import SummaryPage from './components/SummaryPage'
import MembershipPage from './components/MembershipPage'

let orderCounter = 1

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export default function App() {
  const [page, setPage] = useState<Page>('order')
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [managedMenu, setManagedMenu] = useState<MenuItem[]>(menuItems)
  const [members, setMembers] = useState<Member[]>([])

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
