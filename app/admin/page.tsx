'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [tables, setTables] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [seats, setSeats] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTables()
    fetchReservations()
  }, [])

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
    if (data) setReservations(data)
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

  async function cancelReservation(id: number) {
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    fetchReservations()
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '24px', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🍽️ Admin Dashboard</h1>
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
            type="number"
            placeholder="Table Number"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }}
          />
          <input
            type="number"
            placeholder="Number of Seats"
            value={seats}
            onChange={e => setSeats(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f0f0f', color: '#fff', fontSize: '14px' }}
          />
          <button
            onClick={addTable}
            disabled={loading}
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
                borderRadius: '10px',
                padding: '16px',
                minWidth: '140px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem' }}>🪑</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Table {table.table_number}</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>{table.seats} seats</div>
                <div style={{ color: table.is_active ? '#4ade80' : '#ef4444', fontSize: '0.8rem', margin: '4px 0' }}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </div>
                <button
                  onClick={() => toggleTable(table.id, table.is_active)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: table.is_active ? '#ef4444' : '#4ade80',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {table.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservations Section */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
        <h2 style={{ marginBottom: '16px' }}>Reservations ({reservations.length})</h2>
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
                  <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Action</th>
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
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        backgroundColor: res.status === 'confirmed' ? '#14532d' : '#450a0a',
                        color: res.status === 'confirmed' ? '#4ade80' : '#ef4444'
                      }}>
                        {res.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => cancelReservation(res.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      )}
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