import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTicketEmail } from '../../../../lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    if (Number(ticket.price) > 0) {
      return NextResponse.json(
        { error: 'This ticket is not free' },
        { status: 400 }
      );
    }

    if (ticket.capacity) {
      const sold = ticket.quantity_sold || 0;
      const remaining = ticket.capacity - sold;

      if (remaining <= 0) {
        return NextResponse.json({ error: 'Sold out' }, { status: 400 });
      }
      if (quantity > remaining) {
        return NextResponse.json(
          { error: `Only ${remaining} left` },
          { status: 400 }
        );
      }
    }

    const reference = `TB-FREE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          event_id: eventId,
          ticket_type_id: ticketId,
          buyer_email: buyerEmail,
          quantity,
          unit_price: 0,
          subtotal: 0,
          service_fee: 0,
          total: 0,
          paystack_reference: reference,
          status: 'paid',
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    const newSold = (ticket.quantity_sold || 0) + quantity;
    await supabase
      .from('ticket_types')
      .update({ quantity_sold: newSold })
      .eq('id', ticket.id);

    // Send ticket email
    console.log('About to send free ticket email. Order:', reference);
    try {
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (event && ticket) {
        console.log('Calling sendTicketEmail for:', buyerEmail);
        const emailResult = await sendTicketEmail({
          to: buyerEmail,
          name: buyerEmail.split('@')[0],
          event,
          ticket,
          orderId: reference,
          quantity,
          total: 0,
        });
        console.log('Free ticket email result:', JSON.stringify(emailResult));
      }
    } catch (emailErr) {
      console.error('FREE TICKET EMAIL FAILED:', emailErr.message || emailErr);
      console.error('Full error:', JSON.stringify(emailErr, null, 2));
    }

    return NextResponse.json({ reference, success: true });
  } catch (err) {
    console.error('Free ticket error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to register' },
      { status: 500 }
    );
  }
}
