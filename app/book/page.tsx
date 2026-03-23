'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

const quickReplies = [
  'My name is Akshar',
  'I want Table 2',
  '4 guests',
  'Tomorrow',
  '9 PM',
  'Yes, confirm'
]

const steps = [
  { step: '1', label: 'Your Name', example: '"My name is Akshar"' },
  { step: '2', label: 'Table Number', example: '"I want Table 2"' },
  { step: '3', label: 'No. of Guests', example: '"4 guests"' },
  { step: '4', label: 'Date', example: '"Tomorrow" or "25 March"' },
  { step: '5', label: 'Time', example: '"9 PM"' },
  { step: '6', label: 'Confirm', example: '"Yes, confirm"' }
]

const initialAssistantMessage = {
  role: 'assistant',
  content: 'Hello! 👋 Welcome! I am your table booking assistant. I will help you reserve a table in just a few steps!'
}

export default function BookingChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    initialAssistantMessage
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
  const messageStreamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stream = messageStreamRef.current
    if (!stream) return
    stream.scrollTop = stream.scrollHeight
  }, [messages])

  async function sendMessage(text?: string) {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return
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

  function reserveMoreTables() {
    setBooked(false)
    setLoading(false)
    setInput('')
    setHistory([])
    setMessages([initialAssistantMessage])
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <main className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brandIcon}>🍽️</div>
          <div className={styles.brandText}>
            <h1>Table Booking Assistant</h1>
            <p>Fast, friendly reservations in one chat</p>
          </div>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Online
          </div>
        </header>

        <section className={styles.guideCard}>
          <div className={styles.guideTitle}>Booking Flow</div>
          <div className={styles.stepGrid}>
            {steps.map(item => (
              <div key={item.step} className={styles.stepPill}>
                <span className={styles.stepIndex}>{item.step}</span>
                <span className={styles.stepLabel}>{item.label}</span>
                <span className={styles.stepExample}>{item.example}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.chatPane}>
          <div ref={messageStreamRef} className={styles.messageStream}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.fromUser : styles.fromAssistant}`}>
                {msg.role === 'assistant' && <div className={styles.avatar}>🍽️</div>}
                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.messageRow} ${styles.fromAssistant}`}>
                <div className={styles.avatar}>🍽️</div>
                <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {booked && (
              <div className={styles.successCard}>
                <h3>Reservation Confirmed</h3>
                <p>Your table has been booked successfully. Please check with the restaurant staff on arrival.</p>
                <button type='button' className={styles.reserveMoreButton} onClick={reserveMoreTables}>
                  want to reserve more tables ?
                </button>
              </div>
            )}
          </div>

          {!booked && (
            <div className={styles.quickBar}>
              <span className={styles.quickLabel}>Quick replies</span>
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(reply)}
                  disabled={loading}
                  className={styles.quickBtn}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {!booked && (
            <div className={styles.composer}>
              <input
                type='text'
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder='Type your message or use quick replies...'
                disabled={loading}
                className={styles.chatInput}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className={styles.sendButton}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </section>
      </main>

    </div>
  )
}