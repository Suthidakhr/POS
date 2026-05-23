import { useMemo, useState } from 'react'
import { Order } from '../types'

interface Props {
  orders: Order[]
}

type Period = 'today' | 'week' | 'all'

function startOf(period: Period): Date {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    d.setHours(0, 0, 0, 0)
    return d
  }
  return new Date(0)
}

export default function SummaryPage({ orders }: Props) {
  const [period, setPeriod] = useState<Period>('today')

  const filtered = useMemo(() => {
    const start = startOf(period)
    return orders.filter(o => new Date(o.createdAt) >= start)
  }, [orders, period])

  const completed = filtered.filter(o => o.status === 'completed')
  const cancelled = filtered.filter(o => o.status === 'cancelled')
  const revenue = completed.reduce((s, o) => s + o.total, 0)
  const totalItems = completed.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0)
  const avgOrder = completed.length > 0 ? revenue / completed.length : 0

  // Top items
  const itemCounts: Record<string, { name: string; emoji: string; count: number; revenue: number }> = {}
  completed.forEach(o => {
    o.items.forEach(i => {
      const id = i.menuItem.id
      if (!itemCounts[id]) itemCounts[id] = { name: i.menuItem.name, emoji: i.menuItem.emoji, count: 0, revenue: 0 }
      itemCounts[id].count += i.quantity
      itemCounts[id].revenue += i.menuItem.price * i.quantity
    })
  })
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 8)

  // Category revenue
  const catRevenue: Record<string, number> = {}
  completed.forEach(o => {
    o.items.forEach(i => {
      catRevenue[i.menuItem.category] = (catRevenue[i.menuItem.category] || 0) + i.menuItem.price * i.quantity
    })
  })
  const catTotal = Object.values(catRevenue).reduce((s, v) => s + v, 0)

  // Payment breakdown
  const payBreakdown: Record<string, number> = {}
  completed.forEach(o => {
    const m = o.paymentMethod || 'cash'
    payBreakdown[m] = (payBreakdown[m] || 0) + o.total
  })

  // Hourly (today)
  const hourly: Record<number, number> = {}
  completed.forEach(o => {
    const h = new Date(o.createdAt).getHours()
    hourly[h] = (hourly[h] || 0) + o.total
  })
  const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7am–8pm
  const maxHourly = Math.max(...hours.map(h => hourly[h] || 0), 1)

  const catColors: Record<string, string> = {
    coffee: '#758650', tea: '#B5C267', smoothie: '#FFE27C', food: '#E8B634', bakery: '#C9B6A1'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F8F9F8', padding: '20px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#758650' }}>Sales Summary</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', 'week', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: period === p ? '#758650' : '#fff',
                color: period === p ? '#fff' : '#758650',
                border: `1.5px solid ${period === p ? '#758650' : '#C9B6A1'}`,
                fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              }}
            >{p === 'all' ? 'All Time' : p === 'week' ? 'Last 7 Days' : 'Today'}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Revenue" value={`฿${revenue.toLocaleString()}`} icon="💰" color="#E8B634" />
        <KpiCard label="Orders Completed" value={`${completed.length}`} icon="✅" color="#758650" />
        <KpiCard label="Avg. Order Value" value={`฿${Math.round(avgOrder)}`} icon="📈" color="#B5C267" />
        <KpiCard label="Items Sold" value={`${totalItems}`} icon="🛍️" color="#C9B6A1" />
      </div>

      {/* Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatBox label="Pending / Preparing" value={filtered.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length} color="#FFF3CC" textColor="#c07800" />
        <StatBox label="Cancelled Orders" value={cancelled.length} color="#fef2f2" textColor="#ef4444" />
        <StatBox label="Total Tax Collected" value={`฿${completed.reduce((s, o) => s + o.tax, 0)}`} color="#F8F9F8" textColor="#758650" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Hourly Chart */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, color: '#758650', marginBottom: 14, fontSize: 14 }}>Revenue by Hour</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {hours.map(h => {
              const val = hourly[h] || 0
              const pct = val / maxHourly
              return (
                <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', background: pct > 0 ? '#B5C267' : '#f0f0f0',
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.max(pct * 80, pct > 0 ? 4 : 0)}px`,
                    transition: 'height 0.3s',
                  }} title={`฿${val}`} />
                  <div style={{ fontSize: 9, color: '#C9B6A1', writingMode: 'horizontal-tb' }}>{h}</div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: '#C9B6A1', marginTop: 6, textAlign: 'center' }}>Hour of day (7–20)</div>
        </div>

        {/* Payment Breakdown */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, color: '#758650', marginBottom: 14, fontSize: 14 }}>Payment Methods</div>
          {Object.keys(payBreakdown).length === 0 && (
            <div style={{ color: '#C9B6A1', fontSize: 13 }}>No data yet</div>
          )}
          {(['cash', 'card', 'qr'] as const).map(m => {
            const val = payBreakdown[m] || 0
            const pct = revenue > 0 ? (val / revenue) * 100 : 0
            const icons: Record<string, string> = { cash: '💵', card: '💳', qr: '📱' }
            return (
              <div key={m} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span>{icons[m]} {m.toUpperCase()}</span>
                  <span style={{ fontWeight: 600 }}>฿{val} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: '#E8B634', height: '100%', borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Top Items */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, color: '#758650', marginBottom: 14, fontSize: 14 }}>Top Selling Items</div>
          {topItems.length === 0 && <div style={{ color: '#C9B6A1', fontSize: 13 }}>No sales yet</div>}
          {topItems.map((item, i) => (
            <div key={item.name} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < topItems.length - 1 ? '1px solid #f8f8f8' : 'none',
            }}>
              <span style={{
                width: 22, height: 22, background: i < 3 ? '#FFE27C' : '#f0f0f0',
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#758650',
              }}>{i + 1}</span>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.name}</span>
              <span style={{ fontSize: 12, color: '#C9B6A1' }}>{item.count}×</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8B634' }}>฿{item.revenue}</span>
            </div>
          ))}
        </div>

        {/* Category Revenue */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, color: '#758650', marginBottom: 14, fontSize: 14 }}>Revenue by Category</div>
          {catTotal === 0 && <div style={{ color: '#C9B6A1', fontSize: 13 }}>No sales yet</div>}
          {Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
            const pct = catTotal > 0 ? (val / catTotal) * 100 : 0
            const catEmojis: Record<string, string> = { coffee: '☕', tea: '🍵', smoothie: '🥤', food: '🍽️', bakery: '🥐' }
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span>{catEmojis[cat] || '✨'} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  <span style={{ fontWeight: 600 }}>฿{val} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, background: catColors[cat] || '#B5C267',
                    height: '100%', borderRadius: 4,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Completed Orders */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#758650', marginBottom: 14, fontSize: 14 }}>Recent Completed Orders</div>
        {completed.length === 0 && <div style={{ color: '#C9B6A1', fontSize: 13 }}>No completed orders yet</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          {completed.slice(0, 10).map(o => (
            <div key={o.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
              borderBottom: '1px solid #f8f8f8', fontSize: 13,
            }}>
              <span style={{
                background: '#FFE27C', color: '#758650', fontWeight: 800,
                borderRadius: 6, padding: '3px 8px', fontSize: 12,
              }}>#{o.orderNumber}</span>
              <span style={{ flex: 1, color: '#555' }}>
                {o.customerName || '-'}
                {o.tableNumber && <span style={{ color: '#C9B6A1' }}> · T{o.tableNumber}</span>}
              </span>
              <span style={{ color: '#C9B6A1' }}>
                {new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ color: '#888' }}>{o.paymentMethod?.toUpperCase()}</span>
              <span style={{ fontWeight: 700, color: '#E8B634', minWidth: 60, textAlign: 'right' }}>฿{o.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#C9B6A1', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function StatBox({ label, value, color, textColor }: { label: string; value: string | number; color: string; textColor: string }) {
  return (
    <div style={{
      background: color, borderRadius: 12, padding: '14px 18px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: 13, color: textColor, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: textColor }}>{value}</span>
    </div>
  )
}
