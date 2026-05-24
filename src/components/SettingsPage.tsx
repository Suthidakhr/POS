import { useState, useEffect } from 'react'
import { StaffAccount, Role } from '../types'
import * as api from '../api'
import { useBreakpoint } from '../hooks/useBreakpoint'

const ROLE_LABEL: Record<Role, string> = { manager: 'Manager', cashier: 'Cashier' }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid #e0e0e0',
  fontSize: 14,
  background: '#fafafa',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#999',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

export default function SettingsPage() {
  const { isMobile } = useBreakpoint()
  const [staff, setStaff] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPin, setEditingPin] = useState<string | null>(null)

  useEffect(() => {
    api.fetchStaff()
      .then(setStaff)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleActive(s: StaffAccount) {
    try {
      const updated = await api.updateStaff(s.id, { active: !s.active })
      setStaff(prev => prev.map(x => x.id === s.id ? updated : x))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function handleChangePinSubmit(staffId: string, newPin: string, confirmPin: string) {
    if (newPin.length < 4) { setError('PIN must be 4 digits'); return }
    if (newPin !== confirmPin) { setError('PINs do not match'); return }
    try {
      await api.updateStaff(staffId, { pin: newPin })
      setEditingPin(null)
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update PIN')
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9B6A1' }}>
        Loading staff…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '32px 40px', background: '#F8F9F8' }}>
      <div style={{ maxWidth: 640 }}>
        <div style={{
          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between', marginBottom: 24, gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#333', margin: 0 }}>Staff Settings</h1>
            <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>Manage staff accounts and PINs</div>
          </div>
          <button
            onClick={() => { setShowAddForm(v => !v); setError('') }}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: '#758650', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Staff'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FFF3F3', border: '1px solid #FFCECE', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#CC3333', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {showAddForm && (
          <AddStaffForm
            onAdd={newStaff => { setStaff(prev => [...prev, newStaff]); setShowAddForm(false) }}
            onError={setError}
            isMobile={isMobile}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {staff.map(s => (
            <div key={s.id} style={{
              background: '#fff', borderRadius: 12, padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: s.active ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: s.role === 'manager' ? '#758650' : '#C9B6A1',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, flexShrink: 0,
                }}>
                  {s.name[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: s.role === 'manager' ? '#EEF3E8' : '#F5F0EC',
                      color: s.role === 'manager' ? '#758650' : '#8B7355',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      {ROLE_LABEL[s.role]}
                    </span>
                    {!s.active && <span style={{ fontSize: 11, color: '#CC3333', fontWeight: 600 }}>Inactive</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <button
                    onClick={() => { setEditingPin(editingPin === s.id ? null : s.id); setError('') }}
                    style={{
                      padding: '7px 14px', borderRadius: 8,
                      background: '#F0F4EB', color: '#758650',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={() => handleToggleActive(s)}
                    style={{
                      padding: '7px 14px', borderRadius: 8,
                      background: s.active ? '#FFF3F3' : '#F0F4EB',
                      color: s.active ? '#CC3333' : '#758650',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>

              {editingPin === s.id && (
                <ChangePinForm
                  onSubmit={(np, cp) => handleChangePinSubmit(s.id, np, cp)}
                  onCancel={() => setEditingPin(null)}
                  isMobile={isMobile}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddStaffForm({ onAdd, onError, isMobile }: { onAdd: (s: StaffAccount) => void; onError: (e: string) => void; isMobile?: boolean }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('cashier')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { onError('Name is required'); return }
    if (pin.length < 4) { onError('PIN must be 4 digits'); return }
    if (pin !== confirmPin) { onError('PINs do not match'); return }

    setSaving(true)
    try {
      const created = await api.createStaff({ name: name.trim(), role, pin })
      onAdd(created)
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to create staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16,
      border: '2px solid #E8F0E0',
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#758650', marginBottom: 16 }}>New Staff Account</div>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 12, marginBottom: 12,
        }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={role} onChange={e => setRole(e.target.value as Role)}>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>PIN (4 digits)</label>
            <input
              style={inputStyle} type="password" inputMode="numeric"
              maxLength={4} value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm PIN</label>
            <input
              style={inputStyle} type="password" inputMode="numeric"
              maxLength={4} value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>
        </div>
        <button
          type="submit" disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: saving ? '#aaa' : '#758650', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Creating…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

function ChangePinForm({ onSubmit, onCancel, isMobile }: { onSubmit: (np: string, cp: string) => void; onCancel: () => void; isMobile?: boolean }) {
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div>
          <label style={labelStyle}>New PIN</label>
          <input
            style={{ ...inputStyle, width: isMobile ? '100%' : 100 }} type="password" inputMode="numeric"
            maxLength={4} value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm PIN</label>
          <input
            style={{ ...inputStyle, width: isMobile ? '100%' : 100 }} type="password" inputMode="numeric"
            maxLength={4} value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onSubmit(newPin, confirmPin)}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#758650', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{ padding: '10px 14px', borderRadius: 8, background: '#F0F0F0', color: '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
