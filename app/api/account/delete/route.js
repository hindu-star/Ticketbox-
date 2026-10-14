import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Delete the user's events first (cascades to ticket_types, orders, tickets)
    // Actually — the profiles table has ON DELETE CASCADE on auth.users(id),
    // and events have ON DELETE CASCADE from organizer_id → auth.users.
    // So deleting the auth user should cascade through everything.
    // But we'll delete events explicitly to be safe.

    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('organizer_id', userId);

    if (eventsError) {
      console.error('Failed to delete events:', eventsError);
    }

    // Delete the profile
    await supabase.from('profiles').delete().eq('id', userId);

    // Delete the auth user (last)
    const { error: userError } = await supabase.auth.admin.deleteUser(userId);

    if (userError) {
      console.error('Failed to delete user:', userError);
      return NextResponse.json(
        { error: userError.message || 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
