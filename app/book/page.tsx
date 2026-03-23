'use client'
import { useState, useRef, useEffect } from 'react'

export default function BookingChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hello! 👋 Welcome! I am your table booking assistant. What is your name?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          phone: 'walk-in',
          conversationHistory: history
        })
      })

      const data = await res.json()

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setHistory(data.updatedHistory || [])

      if (data.booked) setBooked(true)

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }])
    }

    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0f0f0f',
      fontFamily: 'sans-serif',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🍽️</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Table Booking Assistant</div>
          <div style={{ color: '#4ade80', fontSize: '0.75rem' }}>● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: msg.role === 'user' ? '#fff' : '#1a1a1a',
              color: msg.role === 'user' ? '#000' : '#fff',
              border: msg.role === 'assistant' ? '1px solid #333' : 'none',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              color: '#aaa',
              fontSize: '0.9rem'
            }}>
              Typing...
            </div>
          </div>
        )}

        {booked && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            backgroundColor: '#14532d',
            borderRadius: '12px',
            color: '#4ade80',
            fontWeight: 'bold'
          }}>
            ✅ Your table has been booked successfully!
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!booked && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid #333',
              backgroundColor: '#0f0f0f',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: '12px 20px',
              backgroundColor: loading ? '#333' : '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
