import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_USER_ID = '4747975a-50f4-4329-94ef-80672e5ecd31';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function isAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return false;

  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id === ADMIN_USER_ID;
}

export async function POST(request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        payout_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('approve-business error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to approve' },
      { status: 500 }
    );
  }
        }
