import { supabase } from './supabase';

export const ADMIN_USER_ID = '4747975a-50f4-4329-94ef-80672e5ecd31';

export async function getPlatformStats() {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const { data: organizerRows } = await supabase
    .from('events')
    .select('organizer_id');
  const uniqueOrganizers = new Set(
    (organizerRows || []).map((r) => r.organizer_id)
  ).size;

  const { count: publishedEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: draftEvents } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');

  // Fetch the PERMANENT ledger
  const { data: ledger } = await supabase
    .from('platform_earnings')
    .select('platform_fee, gross_amount, ticket_quantity, is_new_event, created_at');

  // 1. My Earnings
  const platformFeeAllTime = (ledger || []).reduce(
    (sum, e) => sum + Number(e.platform_fee || 0),
    0
  );
  const platformFeeThisMonth = (ledger || [])
    .filter((e) => e.created_at && e.created_at >= startOfMonth)
    .reduce((sum, e) => sum + Number(e.platform_fee || 0), 0);

  // 2. Revenue
  const revenueAllTime = (ledger || []).reduce(
    (sum, e) => sum + Number(e.gross_amount || 0),
    0
  );
  const revenueThisMonth = (ledger || [])
    .filter((e) => e.created_at && e.created_at >= startOfMonth)
    .reduce((sum, e) => sum + Number(e.gross_amount || 0), 0);

  // 3. Total Tickets Sold
  const ticketsSold = (ledger || []).reduce(
    (sum, e) => sum + Number(e.ticket_quantity || 0),
    0
  );

  // 4. Total Events Hosted
  const totalEventsHosted = (ledger || []).filter((e) => e.is_new_event).length;

  return {
    organizers: uniqueOrganizers,
    publishedEvents: publishedEvents || 0,
    draftEvents: draftEvents || 0,
    
    // The 4 permanent metrics
    platformFeeAllTime,
    platformFeeThisMonth,
    revenueAllTime,
    revenueThisMonth,
    ticketsSold,
    totalEventsHosted,
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
