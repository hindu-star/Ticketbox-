import { supabase } from './supabase';

export const ADMIN_USER_ID = '4747975a-50f4-4329-94ef-80672e5ecd31';

/**
 * Platform-wide stats.
 * Reads platform earnings from the permanent ledger so they don't disappear
 * when an organizer deletes their event.
 */
export async function getPlatformStats() {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Total organizers (users with at least 1 event)
  const { data: organizerRows } = await supabase
    .from('events')
    .select('organizer_id');
  const uniqueOrganizers = new Set(
    (organizerRows || []).map((r) => r.organizer_id)
  ).size;

  // Events
  const { count: totalEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true });

  const { count: publishedEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: draftEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');

  // Tickets sold (from active ticket_types)
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('quantity_sold');
  const ticketsSold = (ticketTypes || []).reduce(
    (sum, t) => sum + (t.quantity_sold || 0),
    0
  );

  // Orders (paid) - for total volume (disappears if event deleted)
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total, created_at, status')
    .eq('status', 'paid');

  const revenueAllTime = (paidOrders || []).reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const revenueThisMonth = (paidOrders || [])
    .filter((o) => o.created_at && o.created_at >= startOfMonth)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Platform Earnings (from the permanent ledger)
  const { data: earnings } = await supabase
    .from('platform_earnings')
    .select('platform_fee, created_at');

  const platformFeeAllTime = (earnings || []).reduce(
    (sum, e) => sum + Number(e.platform_fee || 0),
    0
  );

  const platformFeeThisMonth = (earnings || [])
    .filter((e) => e.created_at && e.created_at >= startOfMonth)
    .reduce((sum, e) => sum + Number(e.platform_fee || 0), 0);

  return {
    organizers: uniqueOrganizers,
    totalEvents: totalEvents || 0,
    publishedEvents: publishedEvents || 0,
    draftEvents: draftEvents || 0,
    ticketsSold,
    revenueAllTime,
    revenueThisMonth,
    platformFeeAllTime,
    platformFeeThisMonth,
    ordersCount: (paidOrders || []).length,
  };
}

/**
 * Pending business account approvals.
 */
export async function getPendingBusinessApprovals() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      'id, first_name, middle_name, last_name, display_name, username, bank_code, bank_name, account_number, account_name, account_type, payout_verified, updated_at'
    )
    .eq('account_type', 'business')
    .eq('payout_verified', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (profiles || []).map((p) => ({ ...p, email: null }));
}

/**
 * Recent orders across the entire platform.
 */
export async function getRecentOrders(limit = 20) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, buyer_email, total, status, created_at, event_id, quantity, events(title)'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Search user by email (exact match).
 */
export async function searchUserByEmail(email) {
  const clean = String(email || '').toLowerCase().trim();
  if (!clean) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', clean)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

  const { data: events } = await supabase
    .from('events')
    .select('id, title, status, event_date')
    .eq('organizer_id', profile.id);

  return {
    profile,
    events: events || [],
  };
}

/**
 * Approve a business account.
 */
export async function approveBusinessAccount(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      payout_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Reject a business account — clears bank details.
 */
export async function rejectBusinessAccount(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      bank_code: null,
      bank_name: null,
      account_number: null,
      account_name: null,
      account_type: 'personal',
      payout_verified: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}
