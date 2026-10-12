import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { ticketId, password } = await request.json();

    if (!ticketId || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: ticket, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.ticket_kind !== 'invite') {
      return NextResponse.json({ error: 'Not an invite ticket' }, { status: 400 });
    }

    if (!ticket.invite_password) {
      return NextResponse.json({ error: 'No password set' }, { status: 400 });
    }

    if (String(ticket.invite_password) !== String(password).trim()) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Verify invite error:', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
