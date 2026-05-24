import { useState, useEffect } from 'react'
import { AuthUser } from '../types'
import * as api from '../api'

interface Props {
  onLogin: (user: AuthUser) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [staffNames, setStaffNames] = useState<{ id: string; name: string }[]>([])
  const [selectedName, setSelectedName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [namesLoading, setNamesLoading] = useState(true)

  useEffect(() => {
    api.fetchStaffNames()
      .then(names => {
        setStaffNames(names)
        if (names.length === 1) setSelectedName(names[0].name)
      })
      .catch(() => setError('Cannot reach server. Make sure the server is running.'))
      .finally(() => setNamesLoading(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedName) { setError('Please select your name'); return }
    if (pin.length < 4) { setError('PIN must be 4 digits'); return }

    setLoading(true)
    setError('')
    try {
      const user = await api.login(selectedName, pin)
      onLogin(user)
    } catch (err: unknown) {
      setPin('')
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #758650 0%, #5c6a3e 100%)',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 32px 36px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>☕</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#758650', letterSpacing: 1 }}>Shesha Cafe</div>
          <div style={{ fontSize: 12, color: '#C9B6A1', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>Point of Sale</div>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Staff Name
            </label>
            <select
              value={selectedName}
              onChange={e => { setSelectedName(e.target.value); setError('') }}
              disabled={namesLoading || loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1.5px solid #e0e0e0',
                fontSize: 15,
                color: selectedName ? '#333' : '#aaa',
                background: '#fafafa',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">
                {namesLoading ? 'Loading…' : '— Select your name —'}
              </option>
              {staffNames.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
              disabled={loading}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1.5px solid #e0e0e0',
                fontSize: 22,
                letterSpacing: 8,
                textAlign: 'center',
                background: '#fafafa',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF3F3',
              border: '1px solid #FFCECE',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#CC3333',
              marginBottom: 16,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || namesLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: loading ? '#aaa' : '#758650',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
