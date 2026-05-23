import { useState } from 'react'
import { MenuItem, OrderItem, Order, Member } from '../types'
import { categories } from '../data/menu'

interface Props {
  menuItems: MenuItem[]
  cart: OrderItem[]
  onAddToCart: (item: MenuItem) => void
  onUpdateCartItem: (id: string, qty: number, note?: string) => void
  onClearCart: () => void
  onPlaceOrder: (
    items: OrderItem[],
    opts: {
      tableNumber?: number
      customerName?: string
      discount: number
      paymentMethod: 'cash' | 'card' | 'qr'
      memberId?: string
      memberDiscount: number
    }
  ) => Order
  onFindMember: (phone: string) => Member | undefined
}

export default function OrderPage({ menuItems, cart, onAddToCart, onUpdateCartItem, onClearCart, onPlaceOrder, onFindMember }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  // Member lookup
  const [memberPhone, setMemberPhone] = useState('')
  const [activeMember, setActiveMember] = useState<Member | null>(null)
  const [memberNotFound, setMemberNotFound] = useState(false)

  const filtered = menuItems.filter(m => {
    const catMatch = selectedCategory === 'all' || m.category === selectedCategory
    const searchMatch = m.name.toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch && m.available
  })

  const subtotal = cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0)
  const memberDiscountAmt = activeMember ? Math.round(subtotal * 0.1) : 0
  const manualDiscountAmt = Math.min(Number(discount) || 0, subtotal - memberDiscountAmt)
  const totalDiscount = memberDiscountAmt + manualDiscountAmt
  const discounted = subtotal - totalDiscount
  const tax = Math.round(discounted * 0.07)
  const total = discounted + tax

  const handleLookupMember = () => {
    setMemberNotFound(false)
    if (!memberPhone.trim()) return
    const found = onFindMember(memberPhone)
    if (found) {
      setActiveMember(found)
      setCustomerName(found.name)
      setMemberNotFound(false)
    } else {
      setActiveMember(null)
      setMemberNotFound(true)
    }
  }

  const handleClearMember = () => {
    setActiveMember(null)
    setMemberPhone('')
    setMemberNotFound(false)
    setCustomerName('')
  }

  const handlePlaceOrder = () => {
    if (cart.length === 0) return
    const order = onPlaceOrder(cart, {
      tableNumber: tableNumber ? Number(tableNumber) : undefined,
      customerName: customerName || undefined,
      discount: manualDiscountAmt,
      paymentMethod,
      memberId: activeMember?.id,
      memberDiscount: memberDiscountAmt,
    })
    setLastOrder(order)
    setShowSuccess(true)
    setTableNumber('')
    setCustomerName('')
    setDiscount('')
    setPaymentMethod('cash')
    setActiveMember(null)
    setMemberPhone('')
    setMemberNotFound(false)
    setTimeout(() => setShowSuccess(false), 3500)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Menu Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 0', background: '#F8F9F8' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#758650', marginBottom: 14 }}>New Order</h1>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              border: '1.5px solid #C9B6A1', fontSize: 14,
              background: '#fff', outline: 'none', marginBottom: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  background: selectedCategory === cat.id ? '#758650' : '#fff',
                  color: selectedCategory === cat.id ? '#fff' : '#758650',
                  border: `1.5px solid ${selectedCategory === cat.id ? '#758650' : '#C9B6A1'}`,
                  fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 24px 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12, alignContent: 'start',
        }}>
          {filtered.map(item => (
            <MenuCard key={item.id} item={item} onClick={() => onAddToCart(item)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#C9B6A1', padding: 40, fontSize: 15 }}>
              No items found
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={{
        width: 320, background: '#fff', borderLeft: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#758650' }}>Order Cart</h2>
            {cart.length > 0 && (
              <button onClick={onClearCart} style={{ fontSize: 12, color: '#C9B6A1', background: 'none', textDecoration: 'underline' }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#C9B6A1', padding: '40px 20px', fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
              Add items to start an order
            </div>
          ) : (
            cart.map(item => (
              <CartItem key={item.menuItem.id} item={item} onUpdate={onUpdateCartItem} />
            ))
          )}
        </div>

        {/* Order Details */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>

          {/* Member Lookup */}
          <div style={{
            background: activeMember ? '#f0faf0' : '#fafafa',
            border: `1.5px solid ${activeMember ? '#B5C267' : '#e8e8e8'}`,
            borderRadius: 10, padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#758650', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              👤 Member Lookup
            </div>
            {activeMember ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#2d2d2d' }}>{activeMember.name}</div>
                  <div style={{ fontSize: 11, color: '#758650', fontWeight: 600 }}>
                    ✓ Member · 10% discount applied
                  </div>
                </div>
                <button onClick={handleClearMember} style={{
                  fontSize: 11, color: '#C9B6A1', background: 'none', textDecoration: 'underline',
                }}>Remove</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={memberPhone}
                  onChange={e => { setMemberPhone(e.target.value); setMemberNotFound(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleLookupMember()}
                  placeholder="Phone number"
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: 7,
                    border: `1.5px solid ${memberNotFound ? '#ff4d4f' : '#e0e0e0'}`,
                    fontSize: 13, outline: 'none', background: '#fff',
                  }}
                />
                <button
                  onClick={handleLookupMember}
                  style={{
                    padding: '7px 12px', borderRadius: 7, background: '#758650',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                  }}
                >Find</button>
              </div>
            )}
            {memberNotFound && (
              <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 5 }}>
                No member found · <span
                  style={{ textDecoration: 'underline', cursor: 'pointer', color: '#758650' }}
                  onClick={() => { setMemberNotFound(false); setMemberPhone('') }}
                >Clear</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Table #"
              type="number"
              style={inputStyle}
            />
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer name"
              style={inputStyle}
            />
          </div>
          <input
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            placeholder="Extra discount (฿)"
            type="number"
            style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
          />

          {/* Payment */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['cash', 'card', 'qr'] as const).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  border: `1.5px solid ${paymentMethod === m ? '#E8B634' : '#e0e0e0'}`,
                  background: paymentMethod === m ? '#FFE27C' : '#fafafa',
                  color: paymentMethod === m ? '#5a4000' : '#888',
                  fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                }}
              >
                {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'} {m}
              </button>
            ))}
          </div>

          {/* Totals */}
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>Subtotal</span><span>฿{subtotal.toFixed(0)}</span>
            </div>
            {memberDiscountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, color: '#758650', fontWeight: 600 }}>
                <span>Member 10%</span><span>-฿{memberDiscountAmt.toFixed(0)}</span>
              </div>
            )}
            {manualDiscountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, color: '#B5C267' }}>
                <span>Discount</span><span>-฿{manualDiscountAmt.toFixed(0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>Tax (7%)</span><span>฿{tax.toFixed(0)}</span>
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontWeight: 700,
            fontSize: 17, color: '#758650', borderTop: '1px solid #f0f0f0',
            paddingTop: 8, marginBottom: 12,
          }}>
            <span>Total</span><span>฿{total.toFixed(0)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: cart.length === 0 ? '#e0e0e0' : '#E8B634',
              color: cart.length === 0 ? '#aaa' : '#fff',
              fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
            }}
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && lastOrder && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: '#758650', color: '#fff', padding: '14px 28px',
          borderRadius: 12, fontSize: 15, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          ✓ Order #{lastOrder.orderNumber} placed — ฿{lastOrder.total}
          {lastOrder.memberDiscount > 0 && ` (saved ฿${lastOrder.memberDiscount})`}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', background: '#fafafa',
}

function MenuCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 12,
        padding: '16px 12px', textAlign: 'left', transition: 'all 0.15s',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#B5C267'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(117,134,80,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 4 }}>{item.emoji}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#2d2d2d', lineHeight: 1.3 }}>{item.name}</div>
      <div style={{ fontSize: 11, color: '#C9B6A1', lineHeight: 1.3 }}>{item.description}</div>
      <div style={{ fontWeight: 700, color: '#E8B634', fontSize: 15, marginTop: 4 }}>฿{item.price}</div>
    </button>
  )
}

function CartItem({ item, onUpdate }: { item: OrderItem; onUpdate: (id: string, qty: number, note?: string) => void }) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState(item.note || '')

  return (
    <div style={{ padding: '10px 20px', borderBottom: '1px solid #f8f8f8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{item.menuItem.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.menuItem.name}</div>
          <div style={{ fontSize: 12, color: '#C9B6A1' }}>฿{item.menuItem.price} each</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onUpdate(item.menuItem.id, item.quantity - 1)}
            style={{
              width: 26, height: 26, borderRadius: 6, background: '#f0f0f0',
              color: '#758650', fontSize: 16, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.menuItem.id, item.quantity + 1)}
            style={{
              width: 26, height: 26, borderRadius: 6, background: '#758650',
              color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8B634', minWidth: 45, textAlign: 'right' }}>
          ฿{item.menuItem.price * item.quantity}
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        <button
          onClick={() => setShowNote(!showNote)}
          style={{ fontSize: 11, color: '#B5C267', background: 'none', textDecoration: 'underline' }}
        >
          {item.note ? `Note: ${item.note}` : '+ note'}
        </button>
      </div>
      {showNote && (
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => { onUpdate(item.menuItem.id, item.quantity, note); setShowNote(false) }}
          placeholder="e.g. no sugar, extra hot..."
          autoFocus
          style={{
            marginTop: 6, width: '100%', padding: '5px 8px',
            borderRadius: 6, border: '1px solid #B5C267', fontSize: 12, outline: 'none',
          }}
        />
      )}
    </div>
  )
}
