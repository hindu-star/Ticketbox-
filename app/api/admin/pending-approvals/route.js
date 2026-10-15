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

export async function GET(request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'id, first_name, middle_name, last_name, display_name, username, bank_code, bank_name, account_number, account_name, account_type, payout_verified, updated_at'
      )
      .eq('account_type', 'business')
      .eq('payout_verified', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Attach emails from auth.users
    const withEmails = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data } = await supabase.auth.admin.getUserById(p.id);
        return {
          ...p,
          email: data?.user?.email || null,
        };
      })
    );

    return NextResponse.json({ approvals: withEmails });
  } catch (err) {
    console.error('pending-approvals error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load approvals' },
      { status: 500 }
    );
  }
}
