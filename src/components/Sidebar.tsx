import { Page, Order, Member, AuthUser, Role } from '../types'
import { useBreakpoint } from '../hooks/useBreakpoint'

function SheshaLogo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="34" fill="rgba(255,255,255,0.12)" />
      <circle cx="36" cy="36" r="34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <path d="M22 30h28l-3 18H25L22 30z" fill="#FFE27C" />
      <rect x="20" y="27" width="32" height="5" rx="2.5" fill="#E8B634" />
      <path d="M50 33 Q60 33 60 40 Q60 47 50 47" stroke="#E8B634" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M29 24 Q27 20 29 16 Q31 12 29 8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 23 Q34 19 36 15 Q38 11 36 7" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M43 24 Q41 20 43 16 Q45 12 43 8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M29 39 Q33 35 38 38 Q33 41 29 39z" fill="#758650" opacity="0.6" />
    </svg>
  )
}

const ALL_NAV: { id: Page; label: string; icon: string; roles: Role[] }[] = [
  { id: 'order',    label: 'New Order',     icon: '🛒', roles: ['cashier', 'manager'] },
  { id: 'manage',   label: 'Manage Orders', icon: '📋', roles: ['cashier', 'manager'] },
  { id: 'menu',     label: 'Menu',          icon: '🍽️', roles: ['manager'] },
  { id: 'members',  label: 'Members',       icon: '👤', roles: ['manager'] },
  { id: 'summary',  label: 'Summary',       icon: '📊', roles: ['manager'] },
  { id: 'settings', label: 'Settings',      icon: '⚙️', roles: ['manager'] },
]

interface Props {
  page: Page
  onNavigate: (p: Page) => void
  orders: Order[]
  members: Member[]
  user: AuthUser
  onLogout: () => void
}

export default function Sidebar({ page, onNavigate, orders, members, user, onLogout }: Props) {
  const { isMobile, isTablet } = useBreakpoint()
  const pending = orders.filter(o => o.status === 'pending').length
  const preparing = orders.filter(o => o.status === 'preparing').length
  const activeCount = pending + preparing

  const navItems = ALL_NAV.filter(item => item.roles.includes(user.role))

  // ── Mobile: fixed top bar + fixed bottom nav ──────────────────────────────
  if (isMobile) {
    return (
      <>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 48, zIndex: 200,
          background: '#758650', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>
            ☕ Shesha Cafe
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600,
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, zIndex: 200,
          background: '#758650', display: 'flex', alignItems: 'stretch',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.12)',
        }}>
          {navItems.map(item => {
            const active = page === item.id
            const badge = item.id === 'manage' && activeCount > 0 ? activeCount : null
            const shortLabel = item.label.length > 7 ? item.label.slice(0, 6) + '…' : item.label
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  borderTop: active ? '2px solid #FFE27C' : '2px solid transparent',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{shortLabel}</span>
                {badge !== null && (
                  <span style={{
                    position: 'absolute', top: 6, right: '50%', marginRight: -18,
                    background: '#E8B634', color: '#fff', fontSize: 9, fontWeight: 700,
                    borderRadius: 8, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  // ── Tablet: 64px icon-only sidebar ────────────────────────────────────────
  if (isTablet) {
    return (
      <aside style={{
        width: 64, background: '#758650', display: 'flex',
        flexDirection: 'column', padding: 0, flexShrink: 0,
      }}>
        <div style={{
          padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 26 }}>☕</span>
        </div>

        <nav style={{ flex: 1, padding: '6px 0' }}>
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
                title={item.label}
                style={{
                  width: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '11px 0',
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                  borderLeft: active ? '3px solid #FFE27C' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {badge !== null && (
                  <span style={{
                    position: 'absolute', top: 7, right: 8,
                    background: '#E8B634', color: '#fff', fontSize: 9, fontWeight: 700,
                    borderRadius: 8, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{
          padding: '10px 0 14px', borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div
            title={`${user.name} (${user.role})`}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}
          >
            {user.name[0].toUpperCase()}
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)',
              borderRadius: 6, padding: '5px 8px', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            →
          </button>
        </div>
      </aside>
    )
  }

  // ── Desktop: full 220px sidebar ───────────────────────────────────────────
  return (
    <aside style={{
      width: 220, background: '#758650',
      display: 'flex', flexDirection: 'column',
      padding: '0', flexShrink: 0,
    }}>
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <SheshaLogo />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase' }}>Shesha</div>
          <div style={{ color: '#FFE27C', fontSize: 11, marginTop: 1, letterSpacing: 2, textTransform: 'uppercase' }}>Cafe POS</div>
        </div>
      </div>

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
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 24px',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.75)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid #FFE27C' : '3px solid transparent',
                textAlign: 'left', transition: 'all 0.15s', position: 'relative',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge !== null && (
                <span style={{
                  background: '#E8B634', color: '#fff', fontSize: 11, fontWeight: 700,
                  borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center',
                }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
          }}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {user.role}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: 8,
            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)',
            fontSize: 12, fontWeight: 600, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <span>→</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
