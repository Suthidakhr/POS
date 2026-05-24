import { useState, useCallback, useEffect, useRef } from 'react'
import { Order, OrderItem, OrderStatus, Page, MenuItem, Member, AuthUser } from './types'
import * as api from './api'
import { useBreakpoint } from './hooks/useBreakpoint'
import Sidebar from './components/Sidebar'
import OrderPage from './components/OrderPage'
import ManageOrderPage from './components/ManageOrderPage'
import MenuManagePage from './components/MenuManagePage'
import SummaryPage from './components/SummaryPage'
import MembershipPage from './components/MembershipPage'
import SettingsPage from './components/SettingsPage'
import LoginPage from './components/LoginPage'

const CASHIER_PAGES: Page[] = ['order', 'manage']

export default function App() {
  const { isMobile } = useBreakpoint()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [page, setPage] = useState<Page>('order')
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [managedMenu, setManagedMenu] = useState<MenuItem[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function navigate(p: Page) {
    if (authUser?.role === 'cashier' && !CASHIER_PAGES.includes(p)) {
      showToast('Access restricted')
      return
    }
    setPage(p)
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [menu, fetchedOrders, fetchedMembers] = await Promise.all([
        api.fetchMenu(), api.fetchOrders(), api.fetchMembers()
      ])
      setManagedMenu(menu)
      setOrders(fetchedOrders)
      setMembers(fetchedMembers)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    api.getMe()
      .then(user => {
        setAuthUser(user)
        setAuthChecked(true)
        return loadData()
      })
      .catch(() => {
        setAuthChecked(true)
      })
  }, [])

  async function handleLogin(user: AuthUser) {
    setAuthUser(user)
    setPage('order')
    await loadData()
  }

  async function handleLogout() {
    try { await api.logout() } catch { /* ignore */ }
    setAuthUser(null)
    setOrders([])
    setManagedMenu([])
    setMembers([])
    setCart([])
    setPage('order')
  }

  // ─── Cart & order handlers ─────────────────────────────────────────────────

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

  const placeOrder = useCallback(async (
    items: OrderItem[],
    opts: { tableNumber?: number; customerName?: string; discount: number; paymentMethod: 'cash' | 'card' | 'qr'; memberId?: string; memberDiscount: number }
  ) => {
    const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)
    const discounted = subtotal - opts.discount - opts.memberDiscount
    const tax = Math.round(discounted * 0.07)
    const total = discounted + tax

    const order = await api.createOrder({
      items,
      tableNumber: opts.tableNumber,
      customerName: opts.customerName,
      discount: opts.discount,
      memberDiscount: opts.memberDiscount,
      tax,
      total,
      paymentMethod: opts.paymentMethod,
      memberId: opts.memberId,
    })

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

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    await api.updateOrderStatus(orderId, status)
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status, completedAt: status === 'completed' ? new Date() : o.completedAt }
        : o
    ))
  }, [])

  const deleteOrder = useCallback(async (orderId: string) => {
    await api.deleteOrder(orderId)
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }, [])

  const updateMenuItem = useCallback(async (updated: MenuItem) => {
    await api.updateMenuItem(updated)
    setManagedMenu(prev => prev.map(m => m.id === updated.id ? updated : m))
  }, [])

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    const created = await api.createMenuItem(item)
    setManagedMenu(prev => [...prev, created])
  }, [])

  const deleteMenuItem = useCallback(async (id: string) => {
    await api.deleteMenuItem(id)
    setManagedMenu(prev => prev.filter(m => m.id !== id))
  }, [])

  const addMember = useCallback(async (data: { name: string; phone: string; email?: string }) => {
    const member = await api.createMember(data)
    setMembers(prev => [member, ...prev])
    return member
  }, [])

  const deleteMember = useCallback(async (id: string) => {
    await api.deleteMember(id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  const findMemberByPhone = useCallback((phone: string) => {
    return members.find(m => m.phone === phone.trim())
  }, [members])

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!authChecked) return <LoadingScreen message="Checking session…" />
  if (!authUser) return <LoginPage onLogin={handleLogin} />
  if (loading) return <LoadingScreen message="Connecting to database…" />
  if (error) return <ErrorScreen message={error} onRetry={loadData} />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {toast && <Toast message={toast} />}
      <Sidebar
        page={page}
        onNavigate={navigate}
        orders={orders}
        members={members}
        user={authUser}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: isMobile ? 48 : 0, paddingBottom: isMobile ? 60 : 0 }}>
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
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F8F9F8', gap: 16,
    }}>
      <div style={{ fontSize: 52 }}>☕</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#758650', letterSpacing: 1 }}>Shesha Cafe POS</div>
      <div style={{ fontSize: 14, color: '#C9B6A1' }}>{message}</div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F8F9F8', gap: 16,
    }}>
      <div style={{ fontSize: 52 }}>⚠️</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#758650' }}>Cannot reach database</div>
      <div style={{
        fontSize: 13, color: '#C9B6A1', maxWidth: 380, textAlign: 'center', lineHeight: 1.6,
      }}>{message}</div>
      <div style={{ fontSize: 12, color: '#aaa', maxWidth: 380, textAlign: 'center' }}>
        Make sure the server is running: <code>npm run dev:all</code>
      </div>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8, padding: '11px 28px', borderRadius: 10,
          background: '#758650', color: '#fff', fontSize: 14, fontWeight: 700,
        }}
      >
        Retry
      </button>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#333', color: '#fff', padding: '10px 20px',
      borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      {message}
    </div>
  )
}
