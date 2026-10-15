import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction } from '../../../../lib/paystack';
import { sendTicketEmail } from '../../../../lib/email';
import { createTicketsForOrder } from '../../../../lib/events';

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
    let shouldSendEmail = false;

    if (reference.startsWith('TB-FREE-')) {
      // Free flow handled elsewhere — just look up
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_reference', reference)
        .single();
      order = data;
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

      const isNewlyPaid =
        existingOrder && existingOrder.status !== 'paid';

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('paystack_reference', reference)
        .select()
        .single();

      order = updatedOrder;
      shouldSendEmail = !!isNewlyPaid;

      if (isNewlyPaid && existingOrder) {
        // Increment sold count
        const { data: ticket } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('id', existingOrder.ticket_type_id)
          .single();

        if (ticket) {
          const newSold =
            (ticket.quantity_sold || 0) + existingOrder.quantity;
          await supabase
            .from('ticket_types')
            .update({ quantity_sold: newSold })
            .eq('id', ticket.id);
        }

        // Create individual tickets
        try {
          await createTicketsForOrder(
            existingOrder.id,
            existingOrder.event_id,
            existingOrder.quantity
          );
          console.log(
            'Created',
            existingOrder.quantity,
            'tickets for order',
            existingOrder.id
          );
        } catch (ticketErr) {
          console.error('Ticket creation error:', ticketErr);
        }

        // Increment promo code usage
        if (existingOrder.promo_code_id) {
          try {
            const { data: promoRow } = await supabase
              .from('promo_codes')
              .select('times_used')
              .eq('id', existingOrder.promo_code_id)
              .single();

            if (promoRow) {
              await supabase
                .from('promo_codes')
                .update({
                  times_used: (promoRow.times_used || 0) + 1,
                })
                .eq('id', existingOrder.promo_code_id);
              console.log(
                'Incremented promo code:',
                existingOrder.promo_code_id
              );
            }
          } catch (promoErr) {
            console.error('Promo increment error:', promoErr);
          }
        }
      }
    }

    // Send email if newly paid
    if (shouldSendEmail && order) {
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

        // Get individual tickets
        const { data: ticketRows } = await supabase
          .from('tickets')
          .select('id')
          .eq('order_id', order.id)
          .order('ticket_number', { ascending: true });

        const ticketIds = (ticketRows || []).map((t) => t.id);

        if (event && ticket) {
          console.log('Calling sendTicketEmail for:', order.buyer_email);
          const emailResult = await sendTicketEmail({
            to: order.buyer_email,
            name: order.buyer_email.split('@')[0],
            event,
            ticket,
            orderId: order.paystack_reference,
            quantity: order.quantity,
            total: order.total,
            ticketIds,
          });
          console.log('Ticket email result:', JSON.stringify(emailResult));
        }
      } catch (emailErr) {
        console.error('TICKET EMAIL FAILED:', emailErr.message || emailErr);
      }
    }

    return NextResponse.json({
      order: order || null,
      paystack: {
        amount: 0,
        reference,
        paid_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
