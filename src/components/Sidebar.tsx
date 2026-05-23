import { Page, Order, Member } from '../types'

function SheshaLogo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circular background */}
      <circle cx="36" cy="36" r="34" fill="rgba(255,255,255,0.12)" />
      <circle cx="36" cy="36" r="34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

      {/* Coffee cup body */}
      <path d="M22 30h28l-3 18H25L22 30z" fill="#FFE27C" />

      {/* Cup rim */}
      <rect x="20" y="27" width="32" height="5" rx="2.5" fill="#E8B634" />

      {/* Handle */}
      <path d="M50 33 Q60 33 60 40 Q60 47 50 47" stroke="#E8B634" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Steam swirls */}
      <path d="M29 24 Q27 20 29 16 Q31 12 29 8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 23 Q34 19 36 15 Q38 11 36 7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M43 24 Q41 20 43 16 Q45 12 43 8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Leaf on cup */}
      <path d="M29 39 Q33 35 38 38 Q33 41 29 39z" fill="#758650" opacity="0.6" />
    </svg>
  )
}

interface Props {
  page: Page
  onNavigate: (p: Page) => void
  orders: Order[]
  members: Member[]
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'order', label: 'New Order', icon: '🛒' },
  { id: 'manage', label: 'Manage Orders', icon: '📋' },
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'members', label: 'Members', icon: '👤' },
  { id: 'summary', label: 'Summary', icon: '📊' },
]

export default function Sidebar({ page, onNavigate, orders, members }: Props) {
  const pending = orders.filter(o => o.status === 'pending').length
  const preparing = orders.filter(o => o.status === 'preparing').length
  const activeCount = pending + preparing

  return (
    <aside style={{
      width: 220,
      background: '#758650',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <SheshaLogo />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase' }}>Shesha</div>
          <div style={{ color: '#FFE27C', fontSize: 11, marginTop: 1, letterSpacing: 2, textTransform: 'uppercase' }}>Cafe POS</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map(item => {
          const active = page === item.id
          const badge =
            item.id === 'manage' && activeCount > 0 ? activeCount :
            item.id === 'members' && members.length > 0 ? members.length :
            null

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 24px',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid #FFE27C' : '3px solid transparent',
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge && (
                <span style={{
                  background: '#E8B634',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 7px',
                  minWidth: 20,
                  textAlign: 'center',
                }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
      }}>
        <div style={{ marginBottom: 2 }}>Total Orders Today</div>
        <div style={{ color: '#FFE27C', fontWeight: 700, fontSize: 20 }}>{orders.length}</div>
      </div>
    </aside>
  )
}
