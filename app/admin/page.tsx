'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tables, setTables] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [seats, setSeats] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [restaurantName, setRestaurantName] = useState('')
  const [daysLeft, setDaysLeft] = useState('')

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setLoggedIn(true)
      setRestaurantName(sessionStorage.getItem('restaurant_name') || '')
      setDaysLeft(sessionStorage.getItem('days_left') || '')
    }
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    fetchTables()
    fetchReservations()
    const interval = setInterval(() => {
      fetchReservations()
      fetchTables()
    }, 5000)
    return () => clearInterval(interval)
  }, [loggedIn])

  async function handleLogin() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_username', username)
      .eq('owner_password', password)
      .single()

    if (error || !data) {
      setLoginError('Wrong username or password.')
      return
    }

    if (!data.is_active) {
      setLoginError('Your subscription has been revoked. Please contact the developer.')
      return
    }

    const days = Math.ceil((new Date(data.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    if (days <= 0) {
      setLoginError('Your subscription has expired. Please contact the developer to renew.')
      return
    }

    sessionStorage.setItem('admin_auth', 'true')
    sessionStorage.setItem('restaurant_id', data.id.toString())
    sessionStorage.setItem('restaurant_name', data.name)
    sessionStorage.setItem('days_left', days.toString())
    setRestaurantName(data.name)
    setDaysLeft(days.toString())
    setLoggedIn(true)
    setLoginError('')
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_auth')
    sessionStorage.removeItem('restaurant_id')
    sessionStorage.removeItem('restaurant_name')
    sessionStorage.removeItem('days_left')
    setLoggedIn(false)
    setUsername('')
    setPassword('')
  }

  async function fetchTables() {
    const { data } = await supabase
      .from('restaurant_tables')
      .select('*')
      .order('table_number')
    if (data) setTables(data)
  }

  async function fetchReservations() {
    const { data } = await supabase
      .from('reservations')
      .select('*, restaurant_tables(table_number)')
      .order('created_at', { ascending: false })
    if (data) {
      setReservations(data)
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }

  async function addTable() {
    if (!tableNumber || !seats) return
    setLoading(true)
    const { error } = await supabase
      .from('restaurant_tables')
      .insert({ table_number: parseInt(tableNumber), seats: parseInt(seats) })
    if (!error) {
      setMessage('Table added successfully!')
      setTableNumber('')
      setSeats('')
      fetchTables()
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  async function toggleTable(id: number, current: boolean) {
    await supabase
      .from('restaurant_tables')
      .update({ is_active: !current })
      .eq('id', id)
    fetchTables()
  }

  async function deleteTable(id: number) {
    await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', id)
    fetchTables()
  }

  async function cancelReservation(id: number) {
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    fetchReservations()
  }

  async function deleteReservation(id: number) {
    await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
    fetchReservations()
  }

  // Login Page
  if (!loggedIn) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: '#0f0f0f',
        fontFamily: 'sans-serif', color: '#fff'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a', border: '1px solid #333',
          borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍽️</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Admin Login</h1>
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Enter your credentials to continue</p>
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
              placeholder="Enter username"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button
            onClick={handleLogin}
            style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>🍽️ Admin Dashboard</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
            {restaurantName} —
            <span style={{ color: parseInt(daysLeft) <= 7 ? '#ef4444' : '#facc15' }}> {daysLeft} days left</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#4ade80', fontSize: '0.75rem' }}>● Auto refreshing every 5s</div>
            <div style={{ color: '#666', fontSize: '0.75rem' }}>Last updated: {lastUpdated}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </div>
      <p style={{ color: '#aaa', marginBottom: '32px' }}>Manage your restaurant tables and reservations</p>

      {message && (
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }}>
          {message}
        </div>
      )}

      {/* Add Table Section */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #333' }}>
        <h2 style={{ marginBottom: '16px' }}>Add New Table</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="number" placeholder="Table Number" value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }}
          />
          <input
            type="number" placeholder="Number of Seats" value={seats}
            onChange={e => setSeats(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }}
          />
          <button
            onClick={addTable} disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Adding...' : 'Add Table'}
          </button>
        </div>
      </div>

      {/* Tables Section */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #333' }}>
        <h2 style={{ marginBottom: '16px' }}>Your Tables ({tables.length})</h2>
        {tables.length === 0 ? (
          <p style={{ color: '#aaa' }}>No tables added yet. Add your first table above.</p>
        ) : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {tables.map(table => (
              <div key={table.id} style={{
                backgroundColor: '#0f0f0f',
                border: `1px solid ${table.is_active ? '#4ade80' : '#ef4444'}`,
                borderRadius: '10px', padding: '16px', minWidth: '140px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem' }}>🪑</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Table {table.table_number}</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>{table.seats} seats</div>
                <div style={{ color: table.is_active ? '#4ade80' : '#ef4444', fontSize: '0.8rem', margin: '4px 0' }}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </div>
                <button
                  onClick={() => toggleTable(table.id, table.is_active)}
                  style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: table.is_active ? '#ef4444' : '#4ade80', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', width: '100%' }}
                >
                  {table.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  style={{ marginTop: '6px', padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', width: '100%' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservations Section */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Reservations ({reservations.length})</h2>
          <button
            onClick={fetchReservations}
            style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            🔄 Refresh
          </button>
        </div>
        {reservations.length === 0 ? (
          <p style={{ color: '#aaa' }}>No reservations yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Table</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Guests</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px' }}>Table {res.restaurant_tables?.table_number}</td>
                    <td style={{ padding: '12px' }}>{res.customer_name}</td>
                    <td style={{ padding: '12px' }}>{res.customer_phone}</td>
                    <td style={{ padding: '12px' }}>{res.guests}</td>
                    <td style={{ padding: '12px' }}>{res.date}</td>
                    <td style={{ padding: '12px' }}>{res.time}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                        backgroundColor: res.status === 'confirmed' ? '#14532d' : '#450a0a',
                        color: res.status === 'confirmed' ? '#4ade80' : '#ef4444'
                      }}>
                        {res.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {res.status === 'confirmed' && (
                          <button
                            onClick={() => cancelReservation(res.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => deleteReservation(res.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}