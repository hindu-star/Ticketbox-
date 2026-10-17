import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Tiny query — counts 1 row, forces DB activity
    const { error } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Keep-alive error:', error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Keep-alive exception:', err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
