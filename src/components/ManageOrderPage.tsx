import { useState } from 'react'
import { Order, OrderStatus } from '../types'

interface Props {
  orders: Order[]
  onUpdateStatus: (id: string, status: OrderStatus) => void
  onDeleteOrder: (id: string) => void
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }> = {
  pending:   { label: 'Pending',   color: '#c07800', bg: '#FFF3CC', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: '#0077b6', bg: '#E0F4FF', next: 'ready',     nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready',     color: '#2d6a4f', bg: '#D8F3DC', next: 'completed', nextLabel: 'Complete' },
  completed: { label: 'Completed', color: '#555',    bg: '#f0f0f0' },
  cancelled: { label: 'Cancelled', color: '#888',    bg: '#f5f5f5' },
}

const tabs: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: 'active', label: 'Active', statuses: ['pending', 'preparing', 'ready'] },
  { id: 'done',   label: 'Completed', statuses: ['completed'] },
  { id: 'all',    label: 'All Orders', statuses: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] },
]

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function elapsed(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

export default function ManageOrderPage({ orders, onUpdateStatus, onDeleteOrder }: Props) {
  const [activeTab, setActiveTab] = useState('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const tab = tabs.find(t => t.id === activeTab)!
  const filtered = orders.filter(o => tab.statuses.includes(o.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9F8' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#758650', marginBottom: 14 }}>Manage Orders</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => {
            const count = orders.filter(o => t.statuses.includes(o.status)).length
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px 8px 0 0',
                  background: activeTab === t.id ? '#F8F9F8' : 'transparent',
                  color: activeTab === t.id ? '#758650' : '#aaa',
                  fontWeight: activeTab === t.id ? 700 : 400,
                  fontSize: 14,
                  borderBottom: activeTab === t.id ? '2px solid #758650' : '2px solid transparent',
                }}
              >
                {t.label} {count > 0 && <span style={{
                  background: activeTab === t.id ? '#758650' : '#e0e0e0',
                  color: activeTab === t.id ? '#fff' : '#888',
                  borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4,
                }}>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Order List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#C9B6A1', padding: '60px 0', fontSize: 15 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            No orders here
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status]
            const expanded = expandedId === order.id
            return (
              <div key={order.id} style={{
                background: '#fff',
                borderRadius: 14,
                border: '1.5px solid #f0f0f0',
                overflow: 'hidden',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}>
                {/* Card Header */}
                <div
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#FFE27C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, color: '#758650', flexShrink: 0,
                  }}>
                    #{order.orderNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2d2d2d' }}>
                      {order.customerName || `Order #${order.orderNumber}`}
                      {order.tableNumber && <span style={{ color: '#C9B6A1', fontWeight: 400, fontSize: 12 }}> · Table {order.tableNumber}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#C9B6A1', marginTop: 2 }}>
                      {formatTime(order.createdAt)} · {elapsed(order.createdAt)} · {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span style={{
                      background: cfg.bg, color: cfg.color,
                      borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                    }}>{cfg.label}</span>
                    <span style={{ fontWeight: 700, color: '#E8B634', fontSize: 14 }}>฿{order.total}</span>
                  </div>
                </div>

                {/* Expanded Items */}
                {expanded && (
                  <div style={{ borderTop: '1px solid #f8f8f8', padding: '10px 18px' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                        fontSize: 13, color: '#555',
                      }}>
                        <span>{item.menuItem.emoji} {item.menuItem.name} ×{item.quantity}{item.note && <span style={{ color: '#C9B6A1' }}> ({item.note})</span>}</span>
                        <span>฿{item.menuItem.price * item.quantity}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 8, fontSize: 12, color: '#aaa' }}>
                      {order.discount > 0 && <div>Discount: -฿{order.discount}</div>}
                      <div>Tax: ฿{order.tax}</div>
                      <div style={{ fontWeight: 700, color: '#758650', fontSize: 14, marginTop: 4 }}>Total: ฿{order.total}</div>
                      <div style={{ marginTop: 2 }}>Payment: {order.paymentMethod?.toUpperCase()}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div style={{
                    padding: '10px 18px', borderTop: '1px solid #f8f8f8',
                    display: 'flex', gap: 8,
                  }}>
                    {cfg.next && (
                      <button
                        onClick={() => onUpdateStatus(order.id, cfg.next!)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 8,
                          background: '#758650', color: '#fff',
                          fontSize: 13, fontWeight: 600,
                        }}
                      >
                        {cfg.nextLabel}
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        background: '#f8f8f8', color: '#C9B6A1',
                        fontSize: 13, fontWeight: 600, border: '1px solid #eee',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {(order.status === 'completed' || order.status === 'cancelled') && (
                  <div style={{ padding: '10px 18px', borderTop: '1px solid #f8f8f8' }}>
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      style={{
                        fontSize: 12, color: '#C9B6A1', background: 'none', textDecoration: 'underline'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
