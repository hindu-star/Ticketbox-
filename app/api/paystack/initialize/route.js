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

    // Fetch the ticket type to get the price
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const subtotal = Number(ticket.price) * quantity;
    const feePercent = Number(process.env.NEXT_PUBLIC_SERVICE_FEE_PERCENT) || 5;
    const serviceFee = Math.round((subtotal * feePercent) / 100);
    const total = subtotal + serviceFee;

    const reference = generateReference();
    const baseUrl = request.headers.get('origin') || 'https://ticketbox-lgsn.vercel.app';

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
    });

    // Store a pending order
    const { data: { user } } = await supabase.auth.getUser();
    
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
