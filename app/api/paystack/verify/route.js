import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction } from '../../../../lib/paystack';
import { sendTicketEmail } from '../../../../lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    console.log('Verify called with reference:', reference);

    let order = null;

    if (reference.startsWith('TB-FREE-')) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_reference', reference)
        .single();
      order = data;
      console.log('Free ticket order found:', !!order);
    } else {
      const paystackData = await verifyTransaction(reference);

      if (paystackData.status !== 'success') {
        return NextResponse.json(
          { error: `Payment status: ${paystackData.status}` },
          { status: 400 }
        );
      }

      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('paystack_reference', reference)
        .select()
        .single();

      order = updatedOrder;

      if (existingOrder && existingOrder.status !== 'paid') {
        const { data: ticket } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('id', existingOrder.ticket_type_id)
          .single();

        if (ticket) {
          const newSold = (ticket.quantity_sold || 0) + existingOrder.quantity;
          await supabase
            .from('ticket_types')
            .update({ quantity_sold: newSold })
            .eq('id', ticket.id);
        }
      }
    }

    console.log('About to send email. Order exists:', !!order);

    if (order) {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', order.event_id)
          .single();

        const { data: ticket } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('id', order.ticket_type_id)
          .single();

        console.log('Event found:', !!event, '| Ticket found:', !!ticket);
        console.log('Buyer email:', order.buyer_email);

        if (event && ticket) {
          console.log('Calling sendTicketEmail now...');
          const emailResult = await sendTicketEmail({
            to: order.buyer_email,
            name: order.buyer_email.split('@')[0],
            event,
            ticket,
            orderId: order.paystack_reference,
            quantity: order.quantity,
            total: order.total,
          });
          console.log('Email result:', JSON.stringify(emailResult));
        }
      } catch (emailErr) {
        console.error('TICKET EMAIL FAILED:', emailErr.message || emailErr);
        console.error('Full error:', JSON.stringify(emailErr, null, 2));
      }
    }

    return NextResponse.json({
      order: order || null,
      paystack: { amount: 0, reference, paid_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
