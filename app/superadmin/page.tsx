'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SuperAdmin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [deletedRestaurants, setDeletedRestaurants] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newExpiry, setNewExpiry] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success'|'error'>('success')

  useEffect(() => {
    const auth = sessionStorage.getItem('superadmin_auth')
    if (auth === 'true') setLoggedIn(true)
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    fetchRestaurants()
    fetchDeletedRestaurants()
    const interval = setInterval(() => {
      fetchRestaurants()
      fetchDeletedRestaurants()
    }, 10000)
    return () => clearInterval(interval)
  }, [loggedIn])

  function handleLogin() {
    if (username === 'akshardev' && password === 'superdev369') {
      sessionStorage.setItem('superadmin_auth', 'true')
      setLoggedIn(true)
      setLoginError('')
    } else {
      setLoginError('Wrong credentials.')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('superadmin_auth')
    setLoggedIn(false)
  }

  function showMsg(msg: string, type: 'success'|'error' = 'success') {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  async function fetchRestaurants() {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setRestaurants(data)
  }

  async function fetchDeletedRestaurants() {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (data) setDeletedRestaurants(data)
  }

  async function toggleAccess(id: number, current: boolean) {
    await supabase
      .from('restaurants')
      .update({ is_active: !current })
      .eq('id', id)
    fetchRestaurants()
    showMsg(current ? 'Access revoked.' : 'Access restored.')
  }

  async function addRestaurant() {
    if (!newName || !newUsername || !newPassword || !newExpiry) return
    const { error } = await supabase
      .from('restaurants')
      .insert({
        name: newName,
        owner_username: newUsername,
        owner_password: newPassword,
        expires_at: newExpiry,
        is_active: true,
        plan: 'premium',
        deleted_at: null
      })
    if (!error) {
      showMsg('Restaurant added successfully!')
      setNewName('')
      setNewUsername('')
      setNewPassword('')
      setNewExpiry('')
      setShowAddForm(false)
      fetchRestaurants()
    }
  }

  async function softDeleteRestaurant(id: number) {
    await supabase
      .from('restaurants')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
    fetchRestaurants()
    fetchDeletedRestaurants()
    showMsg('Restaurant moved to trash. You have 24 hours to restore it.')
  }

  async function restoreRestaurant(id: number) {
    await supabase
      .from('restaurants')
      .update({ deleted_at: null, is_active: true })
      .eq('id', id)
    fetchRestaurants()
    fetchDeletedRestaurants()
    showMsg('Restaurant restored successfully!')
  }

  async function permanentDelete(id: number) {
    await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
    fetchDeletedRestaurants()
    showMsg('Restaurant permanently deleted.', 'error')
  }

  async function extendExpiry(id: number, currentExpiry: string) {
    const current = new Date(currentExpiry)
    current.setMonth(current.getMonth() + 1)
    const newExpiry = current.toISOString().split('T')[0]
    await supabase
      .from('restaurants')
      .update({ expires_at: newExpiry, is_active: true })
      .eq('id', id)
    fetchRestaurants()
    showMsg('Subscription extended by 1 month!')
  }

  function getDaysLeft(expiryDate: string) {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  function getHoursLeft(deletedAt: string) {
    const deleted = new Date(deletedAt)
    const expiry = new Date(deleted.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const hours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))
    return hours
  }

  // Login Page
  if (!loggedIn) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: '#0a0a0a',
        fontFamily: 'sans-serif', color: '#fff'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a', border: '1px solid #333',
          borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚡</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Developer Panel</h1>
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Super Admin Access Only</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: '#450a0a', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Developer username"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Developer password"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>⚡ Developer Panel</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Manage all restaurants and subscriptions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowDeleted(!showDeleted)}
            style={{ padding: '10px 20px', backgroundColor: showDeleted ? '#facc15' : '#1a1a1a', color: showDeleted ? '#000' : '#facc15', border: '1px solid #facc15', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            🗑️ Trash {deletedRestaurants.length > 0 && `(${deletedRestaurants.length})`}
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            + Add Restaurant
          </button>
          <button onClick={handleLogout}
            style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ backgroundColor: messageType === 'success' ? '#14532d' : '#450a0a', border: `1px solid ${messageType === 'success' ? '#4ade80' : '#ef4444'}`, padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: messageType === 'success' ? '#4ade80' : '#ef4444' }}>
          {message}
        </div>
      )}

      {/* Trash / Deleted Restaurants */}
      {showDeleted && (
        <div style={{ backgroundColor: '#1a1a1a', border: '2px solid #facc15', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '6px', color: '#facc15' }}>🗑️ Trash — Deleted Restaurants</h2>
          <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '16px' }}>Restaurants deleted within 24 hours can be restored. After 24 hours they are permanently gone.</p>
          {deletedRestaurants.length === 0 ? (
            <p style={{ color: '#555' }}>No deleted restaurants.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Restaurant</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Username</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Deleted At</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Time Left to Restore</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedRestaurants.map(r => {
                    const hoursLeft = getHoursLeft(r.deleted_at)
                    const canRestore = hoursLeft > 0
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#aaa' }}>{r.name}</td>
                        <td style={{ padding: '12px', color: '#666' }}>{r.owner_username}</td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '0.82rem' }}>
                          {new Date(r.deleted_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {canRestore ? (
                            <span style={{ color: '#facc15', fontWeight: 'bold' }}>{hoursLeft}h left</span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>Expired</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canRestore && (
                              <button onClick={() => restoreRestaurant(r.id)}
                                style={{ padding: '7px 16px', backgroundColor: '#14532d', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                ↩ Restore
                              </button>
                            )}
                            <button onClick={() => permanentDelete(r.id)}
                              style={{ padding: '7px 16px', backgroundColor: '#450a0a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              Delete Forever
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Restaurant Form */}
      {showAddForm && (
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Add New Restaurant</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Restaurant Name" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '200px' }} />
            <input type="text" placeholder="Owner Username" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '180px' }} />
            <input type="password" placeholder="Owner Password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '180px' }} />
            <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }} />
            <button onClick={addRestaurant}
              style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Add
            </button>
            <button onClick={() => setShowAddForm(false)}
              style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Restaurants', value: restaurants.length, color: '#fff' },
          { label: 'Active', value: restaurants.filter(r => r.is_active).length, color: '#4ade80' },
          { label: 'Inactive', value: restaurants.filter(r => !r.is_active).length, color: '#ef4444' },
          { label: 'Expiring Soon', value: restaurants.filter(r => getDaysLeft(r.expires_at) <= 7 && getDaysLeft(r.expires_at) > 0).length, color: '#facc15' },
          { label: 'In Trash', value: deletedRestaurants.length, color: '#facc15' },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '20px 24px', minWidth: '140px' }}>
            <div style={{ color: stat.color, fontSize: '1.8rem', fontWeight: 'bold' }}>{stat.value}</div>
            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active Restaurants */}
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>All Restaurants ({restaurants.length})</h2>
        {restaurants.length === 0 ? (
          <p style={{ color: '#aaa' }}>No restaurants added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Restaurant</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Username</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Plan</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Expiry</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Days Left</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(r => {
                  const daysLeft = getDaysLeft(r.expires_at)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{r.name}</td>
                      <td style={{ padding: '12px', color: '#aaa' }}>{r.owner_username}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: '#1e3a5f', color: '#60a5fa' }}>
                          {r.plan}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#aaa' }}>{r.expires_at}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: daysLeft <= 0 ? '#ef4444' : daysLeft <= 7 ? '#facc15' : '#4ade80', fontWeight: 'bold' }}>
                          {daysLeft <= 0 ? 'Expired' : daysLeft + ' days'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', backgroundColor: r.is_active ? '#14532d' : '#450a0a', color: r.is_active ? '#4ade80' : '#ef4444' }}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => toggleAccess(r.id, r.is_active)}
                            style={{ padding: '6px 12px', backgroundColor: r.is_active ? '#ef4444' : '#4ade80', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            {r.is_active ? 'Revoke' : 'Restore'}
                          </button>
                          <button onClick={() => extendExpiry(r.id, r.expires_at)}
                            style={{ padding: '6px 12px', backgroundColor: '#1e3a5f', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            +1 Month
                          </button>
                          <button onClick={() => softDeleteRestaurant(r.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#facc15', border: '1px solid #facc15', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}