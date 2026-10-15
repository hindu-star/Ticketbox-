import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeTransaction, generateReference } from '../../../../lib/paystack';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { eventId, ticketId, quantity, buyerEmail } = await request.json();

    if (!eventId || !ticketId || !quantity || !buyerEmail) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
// Check if event has ended
const { data: eventData } = await supabase
  .from('events')
  .select('end_date, event_date, end_time')
  .eq('id', eventId)
  .single();

if (eventData) {
  const dateStr = eventData.end_date || eventData.event_date;
  const endDT = eventData.end_time
    ? new Date(`${dateStr}T${eventData.end_time}`)
    : new Date(`${dateStr}T23:59:59`);

  if (endDT < new Date()) {
    return NextResponse.json(
      { error: 'This event has ended.' },
      { status: 400 }
    );
  }
}

    if (ticket.capacity) {
      const sold = ticket.quantity_sold || 0;
      const remaining = ticket.capacity - sold;

      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'This ticket is sold out' },
          { status: 400 }
        );
      }

      if (quantity > remaining) {
        return NextResponse.json(
          { error: `Only ${remaining} ticket${remaining === 1 ? '' : 's'} left` },
          { status: 400 }
        );
      }
    }

    const subtotal = Number(ticket.price) * quantity;
    const feePercent = Number(process.env.NEXT_PUBLIC_SERVICE_FEE_PERCENT) || 5;
    const serviceFee = Math.round((subtotal * feePercent) / 100);
    const total = subtotal + serviceFee;

    // Look up the event's organizer and their subaccount
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: organizer } = await supabase
      .from('profiles')
      .select('paystack_subaccount_code')
      .eq('id', event.organizer_id)
      .single();

    if (!organizer || !organizer.paystack_subaccount_code) {
      return NextResponse.json(
        {
          error:
            'This organizer has not set up payouts yet. Please contact them.',
        },
        { status: 400 }
      );
    }

    const reference = generateReference();
    const baseUrl = request.headers.get('origin') || 'https://ticketbox.com.ng';

    const paystackData = await initializeTransaction({
      email: buyerEmail,
      amount: total,
      reference,
      metadata: {
        eventId,
        ticketId,
        quantity,
        subtotal,
        serviceFee,
        total,
      },
      callbackUrl: `${baseUrl}/checkout/success?reference=${reference}`,
      subaccount: organizer.paystack_subaccount_code,
      bearer: 'account',
    });

    await supabase.from('orders').insert([
      {
        event_id: eventId,
        ticket_type_id: ticketId,
        buyer_email: buyerEmail,
        quantity,
        unit_price: Number(ticket.price),
        subtotal,
        service_fee: serviceFee,
        total,
        paystack_reference: reference,
        status: 'pending',
      },
    ]);

    return NextResponse.json({
      authorization_url: paystackData.authorization_url,
      reference,
    });
  } catch (err) {
    console.error('Initialize error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
