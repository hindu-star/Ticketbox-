import { supabase } from './supabase';

/**
 * Create a notification. Called from server-side API routes.
 * Uses the anon key — RLS allows any insert (see policy).
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}) {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
    },
  ]);

  if (error) {
    console.error('createNotification error:', error);
    throw error;
  }
}

/**
 * Fetch the current user's notifications (most recent first).
 */
export async function getNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get the unread count for the current user.
 */
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Mark all of the user's notifications as read.
 */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}
