'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SuperAdmin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newExpiry, setNewExpiry] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const auth = sessionStorage.getItem('superadmin_auth')
    if (auth === 'true') setLoggedIn(true)
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    fetchRestaurants()
    const interval = setInterval(fetchRestaurants, 10000)
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

  async function fetchRestaurants() {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRestaurants(data)
  }

  async function toggleAccess(id: number, current: boolean) {
    await supabase
      .from('restaurants')
      .update({ is_active: !current })
      .eq('id', id)
    fetchRestaurants()
    setMessage(current ? 'Access revoked.' : 'Access restored.')
    setTimeout(() => setMessage(''), 3000)
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
        plan: 'premium'
      })
    if (!error) {
      setMessage('Restaurant added successfully!')
      setNewName('')
      setNewUsername('')
      setNewPassword('')
      setNewExpiry('')
      setShowAddForm(false)
      fetchRestaurants()
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function deleteRestaurant(id: number) {
    await supabase.from('restaurants').delete().eq('id', id)
    fetchRestaurants()
    setMessage('Restaurant deleted.')
    setTimeout(() => setMessage(''), 3000)
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
    setMessage('Subscription extended by 1 month!')
    setTimeout(() => setMessage(''), 3000)
  }

  function getDaysLeft(expiryDate: string) {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
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
            <div style={{
              backgroundColor: '#450a0a', border: '1px solid #ef4444',
              color: '#ef4444', padding: '10px 16px', borderRadius: '8px',
              marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center'
            }}>
              {loginError}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Username</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Developer username"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Developer password"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Login
          </button>
        </div>
      </div>
    )
  }

  // Super Admin Dashboard
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>⚡ Developer Panel</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Manage all restaurants and subscriptions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            + Add Restaurant
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div style={{ backgroundColor: '#14532d', border: '1px solid #4ade80', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }}>
          {message}
        </div>
      )}

      {/* Add Restaurant Form */}
      {showAddForm && (
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Add New Restaurant</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Restaurant Name"
              value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '200px' }}
            />
            <input
              type="text" placeholder="Owner Username"
              value={newUsername} onChange={e => setNewUsername(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '180px' }}
            />
            <input
              type="password" placeholder="Owner Password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px', minWidth: '180px' }}
            />
            <input
              type="date" placeholder="Expiry Date"
              value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }}
            />
            <button
              onClick={addRestaurant}
              style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}
            >
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
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '20px 24px', minWidth: '140px' }}>
            <div style={{ color: stat.color, fontSize: '1.8rem', fontWeight: 'bold' }}>{stat.value}</div>
            <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Restaurants List */}
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
                        <span style={{
                          color: daysLeft <= 0 ? '#ef4444' : daysLeft <= 7 ? '#facc15' : '#4ade80',
                          fontWeight: 'bold'
                        }}>
                          {daysLeft <= 0 ? 'Expired' : daysLeft + ' days'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                          backgroundColor: r.is_active ? '#14532d' : '#450a0a',
                          color: r.is_active ? '#4ade80' : '#ef4444'
                        }}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => toggleAccess(r.id, r.is_active)}
                            style={{ padding: '6px 12px', backgroundColor: r.is_active ? '#ef4444' : '#4ade80', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            {r.is_active ? 'Revoke' : 'Restore'}
                          </button>
                          <button
                            onClick={() => extendExpiry(r.id, r.expires_at)}
                            style={{ padding: '6px 12px', backgroundColor: '#1e3a5f', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            +1 Month
                          </button>
                          <button
                            onClick={() => deleteRestaurant(r.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Delete
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