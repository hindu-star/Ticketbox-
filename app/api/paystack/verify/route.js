import { import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction } from '../../../../lib/paystack';

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

    // Free ticket — just look up the order
    if (reference.startsWith('TB-FREE-')) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      return NextResponse.json({
        order: order || null,
        paystack: { amount: 0, reference, paid_at: new Date().toISOString() },
      });
    }

    // Paid ticket — verify with Paystack
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

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('paystack_reference', reference)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
    }

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

    return NextResponse.json({
      order: order || null,
      paystack: {
        amount: paystackData.amount / 100,
        reference: paystackData.reference,
        paid_at: paystackData.paid_at,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
} } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction } from '../../../../lib/paystack';

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

    const paystackData = await verifyTransaction(reference);

    if (paystackData.status !== 'success') {
      return NextResponse.json(
        { error: `Payment status: ${paystackData.status}` },
        { status: 400 }
      );
    }

    // Find the order
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    // Mark as paid
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('paystack_reference', reference)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
    }

    // Increment quantity_sold if we haven't already
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

    return NextResponse.json({
      order: order || null,
      paystack: {
        amount: paystackData.amount / 100,
        reference: paystackData.reference,
        paid_at: paystackData.paid_at,
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
