import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { message, phone, conversationHistory, restaurantId } = await req.json()

    // Check if restaurant is active
    if (restaurantId) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (!restaurant || !restaurant.is_active) {
        return NextResponse.json({
          reply: 'Sorry, online booking is currently unavailable. Please contact the restaurant directly.',
          booked: false
        })
      }

      const daysLeft = Math.ceil((new Date(restaurant.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 0) {
        return NextResponse.json({
          reply: 'Sorry, online booking is currently unavailable. Please contact the restaurant directly.',
          booked: false
        })
      }
    }

    const { data: tables } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number')

    const tablesList = tables?.map(t =>
      'Table ' + t.table_number + ' (' + t.seats + ' seats)'
    ).join(', ') || 'No tables available'

    const messages = [
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ]

    const systemPrompt = 'You are a friendly restaurant table booking assistant. Available tables with their seat capacity: ' + tablesList + '. Rules you must follow: 1. When customer asks for a specific table, check if their guest count fits that table. For example if Table 2 has 6 seats and customer has 4 guests, say something like "Table 2 has 6 seats, which is more than you need for 4 guests. I suggest Table 3 which has exactly 4 seats - would you like that instead?" 2. Never book a table where guests exceed the seat capacity. 3. Always suggest the best fitting table based on guest count. 4. Collect in order: Name, Table number, Number of guests, Date, Time. 5. Be conversational and friendly. 6. Once you have ALL details and customer confirms, respond with EXACTLY this on the last line: BOOKING_CONFIRMED:name={name},table={tableNumber},guests={guests},date={date},time={time},phone=' + (phone || 'walk-in')

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ]
        })
      }
    )

    const groqData = await groqRes.json()

    if (!groqRes.ok) {
      return NextResponse.json(
        { reply: 'AI error: ' + (groqData?.error?.message || 'Unknown error') },
        { status: 500 }
      )
    }

    const aiReply = groqData.choices?.[0]?.message?.content || 'Sorry I could not process that.'

    if (aiReply.includes('BOOKING_CONFIRMED:')) {
      const bookingLine = aiReply.split('BOOKING_CONFIRMED:')[1].split('\n')[0]
      const params: Record<string, string> = Object.fromEntries(
        bookingLine.split(',').map((p: string) => p.split('='))
      )

      const { data: tableData } = await supabase
        .from('restaurant_tables')
        .select('id')
        .eq('table_number', parseInt(params.table))
        .single()

      if (tableData) {
        await supabase.from('reservations').insert({
          table_id: tableData.id,
          customer_name: params.name,
          customer_phone: params.phone || 'walk-in',
          guests: parseInt(params.guests),
          date: params.date,
          time: params.time,
          status: 'confirmed'
        })
      }

      const cleanReply = aiReply.split('BOOKING_CONFIRMED:')[0].trim()
      return NextResponse.json({ reply: cleanReply, booked: true })
    }

    return NextResponse.json({
      reply: aiReply,
      booked: false,
      updatedHistory: [...messages, { role: 'assistant', content: aiReply }]
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ reply: 'Server error occurred.' }, { status: 500 })
  }
}