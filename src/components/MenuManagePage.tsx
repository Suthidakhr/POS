import { useState } from 'react'
import { MenuItem, Category } from '../types'
import { categories } from '../data/menu'

interface Props {
  menuItems: MenuItem[]
  onUpdateItem: (item: MenuItem) => Promise<void>
  onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

const emptyItem = (): Omit<MenuItem, 'id'> => ({
  name: '', category: 'coffee', price: 0, description: '', emoji: '☕', available: true
})

export default function MenuManagePage({ menuItems, onUpdateItem, onAddItem, onDeleteItem }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem] = useState(emptyItem())
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = menuItems.filter(m => {
    const catMatch = selectedCategory === 'all' || m.category === selectedCategory
    const searchMatch = m.name.toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch
  })

  const handleSaveEdit = async () => {
    if (!editingItem || busy) return
    setBusy(true)
    setFormError(null)
    try {
      await onUpdateItem(editingItem)
      setEditingItem(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleAddNew = async () => {
    if (!newItem.name.trim() || busy) return
    setBusy(true)
    setFormError(null)
    try {
      await onAddItem(newItem)
      setNewItem(emptyItem())
      setAddingNew(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9F8' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#758650' }}>Menu Management</h1>
          <button
            onClick={() => { setAddingNew(true); setEditingItem(null) }}
            style={{
              background: '#E8B634', color: '#fff', padding: '9px 18px',
              borderRadius: 10, fontSize: 13, fontWeight: 700,
            }}
          >
            + Add Item
          </button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu..."
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10,
            border: '1.5px solid #C9B6A1', fontSize: 14, outline: 'none',
            background: '#fafafa', marginBottom: 12,
          }}
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: selectedCategory === cat.id ? '#758650' : '#fff',
                color: selectedCategory === cat.id ? '#fff' : '#758650',
                border: `1.5px solid ${selectedCategory === cat.id ? '#758650' : '#C9B6A1'}`,
                fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
        {/* Add New Form */}
        {addingNew && (
          <ItemForm
            item={newItem as MenuItem}
            onChange={v => setNewItem(v as Omit<MenuItem, 'id'>)}
            onSave={handleAddNew}
            onCancel={() => { setAddingNew(false); setNewItem(emptyItem()); setFormError(null) }}
            isNew
            busy={busy}
            error={formError}
          />
        )}

        {/* Items Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 80px 72px 80px',
            padding: '10px 18px',
            background: '#F8F9F8',
            fontSize: 11, color: '#C9B6A1', fontWeight: 700, textTransform: 'uppercase', gap: 8,
          }}>
            <span></span>
            <span>Item</span>
            <span>Price</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtered.map((item, i) => (
            <div key={item.id}>
              {editingItem?.id === item.id ? (
                <div style={{ padding: '12px 18px', background: '#fffdf5', borderTop: '1px solid #f0f0f0' }}>
                  <ItemForm
                    item={editingItem}
                    onChange={v => setEditingItem(v as MenuItem)}
                    onSave={handleSaveEdit}
                    onCancel={() => { setEditingItem(null); setFormError(null) }}
                    busy={busy}
                    error={formError}
                  />
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 80px 72px 80px',
                  padding: '11px 18px', alignItems: 'center', gap: 8,
                  borderTop: i === 0 ? 'none' : '1px solid #f8f8f8',
                  opacity: item.available ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#C9B6A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.category} · {item.description}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#E8B634', fontSize: 14 }}>฿{item.price}</span>
                  <button
                    onClick={() => onUpdateItem({ ...item, available: !item.available })}
                    style={{
                      padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: item.available ? '#D8F3DC' : '#f0f0f0',
                      color: item.available ? '#2d6a4f' : '#aaa',
                      border: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.available ? '✓ On' : '✗ Off'}
                  </button>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setEditingItem({ ...item }); setAddingNew(false); setFormError(null) }}
                      style={{ padding: '5px 10px', borderRadius: 7, background: '#FFE27C', color: '#5a4000', fontSize: 12, fontWeight: 600 }}
                    >Edit</button>
                    {confirmDelete === item.id ? (
                      <>
                        <button onClick={async () => {
                          await onDeleteItem(item.id)
                          setConfirmDelete(null)
                        }}
                          style={{ padding: '5px 8px', borderRadius: 7, background: '#ff4d4f', color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</button>
                        <button onClick={() => setConfirmDelete(null)}
                          style={{ padding: '5px 8px', borderRadius: 7, background: '#f0f0f0', color: '#888', fontSize: 11 }}>✗</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(item.id)}
                        style={{ padding: '5px 8px', borderRadius: 7, background: '#f8f8f8', color: '#C9B6A1', fontSize: 13, border: '1px solid #eee' }}>🗑</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#C9B6A1' }}>No items found</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemForm({
  item, onChange, onSave, onCancel, isNew, busy, error
}: {
  item: MenuItem | Omit<MenuItem, 'id'>
  onChange: (v: MenuItem | Omit<MenuItem, 'id'>) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
  busy?: boolean
  error?: string | null
}) {
  const cats: Category[] = ['coffee', 'tea', 'smoothie', 'food', 'bakery']
  const emojis = ['☕', '🍵', '🧋', '🥤', '🍫', '🥭', '🫐', '🍌', '🥑', '🍳', '🥐', '🥪', '🍋', '🌀', '🍽️', '🫙', '🥗', '🌼', '🫖', '🧊']

  return (
    <div style={{
      background: '#fffdf5', border: '1.5px solid #FFE27C',
      borderRadius: 12, padding: 18, marginBottom: 16,
    }}>
      <div style={{ fontWeight: 700, color: '#758650', fontSize: 14, marginBottom: 14 }}>
        {isNew ? '+ New Menu Item' : 'Edit Item'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <input
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          placeholder="Item name *"
          style={formInput}
        />
        <input
          value={item.price}
          onChange={e => onChange({ ...item, price: Number(e.target.value) })}
          placeholder="Price (฿)"
          type="number"
          style={formInput}
        />
        <select
          value={item.category}
          onChange={e => onChange({ ...item, category: e.target.value as Category })}
          style={formInput}
        >
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <input
        value={item.description}
        onChange={e => onChange({ ...item, description: e.target.value })}
        placeholder="Description"
        style={{ ...formInput, width: '100%', marginBottom: 10 }}
      />
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Emoji</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {emojis.map(e => (
            <button
              key={e}
              onClick={() => onChange({ ...item, emoji: e })}
              style={{
                fontSize: 20, padding: '4px 6px', borderRadius: 6,
                background: item.emoji === e ? '#FFE27C' : '#f8f8f8',
                border: item.emoji === e ? '1.5px solid #E8B634' : '1.5px solid transparent',
              }}
            >{e}</button>
          ))}
        </div>
      </div>
      {error && (
        <div style={{
          fontSize: 12, color: '#ff4d4f', background: '#fff2f0',
          border: '1px solid #ffccc7', borderRadius: 8, padding: '8px 12px', marginBottom: 10,
        }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={busy} style={{
          padding: '9px 20px', borderRadius: 9,
          background: busy ? '#aaa' : '#758650',
          color: '#fff', fontWeight: 700, fontSize: 13,
        }}>
          {busy ? 'Saving…' : isNew ? 'Add Item' : 'Save Changes'}
        </button>
        <button onClick={onCancel} disabled={busy} style={{
          padding: '9px 20px', borderRadius: 9, background: '#f0f0f0', color: '#888', fontSize: 13,
        }}>Cancel</button>
      </div>
    </div>
  )
}

const formInput: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0',
  fontSize: 13, outline: 'none', background: '#fff', width: '100%',
}
