import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#0f0f0f',
      color: '#fff'
    }}>
      <h1 style={{ fontSize: '2rem' }}>🍽️ Cafe Booking System</h1>
      <p style={{ color: '#aaa' }}>AI Powered Table Reservation</p>
      <Link href="/admin">
        <button style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}>
          Go to Admin Dashboard
        </button>
      </Link>
    </main>
  )
}