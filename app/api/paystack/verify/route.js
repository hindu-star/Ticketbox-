import { NextResponse } from 'next/server';
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

    // Mark the order as paid
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('paystack_reference', reference)
      .select()
      .single();

    if (error) {
      console.error('Order update error:', error);
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
