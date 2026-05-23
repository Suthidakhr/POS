import { useState } from 'react'
import { Member } from '../types'

interface Props {
  members: Member[]
  onAddMember: (m: Omit<Member, 'id' | 'joinedAt' | 'totalSpent' | 'totalOrders'>) => Member
  onDeleteMember: (id: string) => void
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

const emptyForm = { name: '', phone: '', email: '' }

export default function MembershipPage({ members, onAddMember, onDeleteMember }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [successName, setSuccessName] = useState<string | null>(null)

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  )

  const validate = () => {
    const e: Partial<typeof emptyForm> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (members.some(m => m.phone === form.phone.trim())) e.phone = 'Phone already registered'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const newMember = onAddMember({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined })
    setSuccessName(newMember.name)
    setForm(emptyForm)
    setErrors({})
    setShowForm(false)
    setTimeout(() => setSuccessName(null), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9F8' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#758650' }}>Membership</h1>
            <p style={{ fontSize: 13, color: '#C9B6A1', marginTop: 2 }}>Members enjoy 10% discount on every order</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setErrors({}) }}
            style={{
              background: '#E8B634', color: '#fff', padding: '10px 20px',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
            }}
          >
            + Register Member
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: '#f8f9f8', borderRadius: 10, padding: '10px 16px',
            border: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 22 }}>👤</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#758650' }}>{members.length}</div>
              <div style={{ fontSize: 11, color: '#C9B6A1' }}>Total Members</div>
            </div>
          </div>
          <div style={{
            background: '#f8f9f8', borderRadius: 10, padding: '10px 16px',
            border: '1px solid #f0f0f0', display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#E8B634' }}>
                ฿{members.reduce((s, m) => s + m.totalSpent, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#C9B6A1' }}>Total Member Spend</div>
            </div>
          </div>
          <div style={{
            background: '#FFF3CC', borderRadius: 10, padding: '10px 16px',
            border: '1px solid #FFE27C', display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 22 }}>🏷️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#c07800' }}>10%</div>
              <div style={{ fontSize: 11, color: '#c07800' }}>Member Discount</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
        {/* Register Form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: 14, border: '2px solid #FFE27C',
            padding: 24, marginBottom: 20,
            boxShadow: '0 4px 20px rgba(232,182,52,0.1)',
          }}>
            <div style={{ fontWeight: 700, color: '#758650', fontSize: 16, marginBottom: 18 }}>
              Register New Member
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }) }}
                  placeholder="e.g. Suthida K."
                  style={{ ...formInput, borderColor: errors.name ? '#ff4d4f' : '#e0e0e0' }}
                />
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
              </div>
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input
                  value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: undefined }) }}
                  placeholder="e.g. 0812345678"
                  style={{ ...formInput, borderColor: errors.phone ? '#ff4d4f' : '#e0e0e0' }}
                />
                {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
              </div>
              <div>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. user@email.com"
                  style={formInput}
                />
              </div>
            </div>

            {/* Benefit note */}
            <div style={{
              background: '#f0faf0', border: '1px solid #B5C267', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#758650',
            }}>
              🎁 This member will receive <strong>10% discount</strong> on every order automatically.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 24px', borderRadius: 10, background: '#758650',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                }}
              >Register</button>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); setErrors({}) }}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#f0f0f0', color: '#888', fontSize: 14 }}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #C9B6A1', fontSize: 14, outline: 'none',
            background: '#fff', marginBottom: 14,
          }}
        />

        {/* Member List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#C9B6A1', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 15 }}>{members.length === 0 ? 'No members yet — register the first one!' : 'No members match your search'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                confirmDelete={confirmDelete}
                onDelete={() => setConfirmDelete(member.id)}
                onConfirmDelete={() => { onDeleteMember(member.id); setConfirmDelete(null) }}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Success toast */}
      {successName && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: '#758650', color: '#fff', padding: '14px 28px',
          borderRadius: 12, fontSize: 15, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          ✓ {successName} registered as member!
        </div>
      )}
    </div>
  )
}

function MemberCard({ member, confirmDelete, onDelete, onConfirmDelete, onCancelDelete }: {
  member: Member
  confirmDelete: string | null
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0',
      padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: '#FFE27C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, color: '#758650',
          }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#2d2d2d' }}>{member.name}</div>
            <div style={{ fontSize: 12, color: '#C9B6A1' }}>{member.phone}</div>
            {member.email && <div style={{ fontSize: 12, color: '#C9B6A1' }}>{member.email}</div>}
          </div>
        </div>
        <span style={{
          background: '#f0faf0', color: '#2d6a4f', borderRadius: 8,
          padding: '3px 10px', fontSize: 11, fontWeight: 700,
        }}>
          10% OFF
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: '#F8F9F8', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#758650' }}>{member.totalOrders}</div>
          <div style={{ fontSize: 11, color: '#C9B6A1' }}>Orders</div>
        </div>
        <div style={{ flex: 1, background: '#F8F9F8', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#E8B634' }}>฿{member.totalSpent.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#C9B6A1' }}>Total Spent</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#C9B6A1' }}>Member since {formatDate(member.joinedAt)}</div>
        {confirmDelete === member.id ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888' }}>Remove?</span>
            <button onClick={onConfirmDelete} style={{ padding: '4px 10px', borderRadius: 6, background: '#ff4d4f', color: '#fff', fontSize: 12, fontWeight: 700 }}>Yes</button>
            <button onClick={onCancelDelete} style={{ padding: '4px 10px', borderRadius: 6, background: '#f0f0f0', color: '#888', fontSize: 12 }}>No</button>
          </div>
        ) : (
          <button onClick={onDelete} style={{ fontSize: 12, color: '#C9B6A1', background: 'none', textDecoration: 'underline' }}>Remove</button>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 5,
}
const formInput: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', background: '#fafafa',
}
const errorStyle: React.CSSProperties = {
  fontSize: 11, color: '#ff4d4f', marginTop: 4,
}
