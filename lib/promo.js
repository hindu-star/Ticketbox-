import { supabase } from './supabase';

/**
 * Create a promo code for an event.
 */
export async function createPromoCode({
  eventId,
  organizerId,
  code,
  discountType,
  discountValue,
  maxUses,
  expiresAt,
}) {
  const clean = String(code || '').toUpperCase().trim().replace(/\s+/g, '');
  if (!clean) throw new Error('Code is required');
  if (clean.length < 3) throw new Error('Code must be at least 3 characters');

  if (!['percent', 'fixed'].includes(discountType)) {
    throw new Error('Invalid discount type');
  }

  const value = Number(discountValue);
  if (!value || value <= 0) {
    throw new Error('Discount value must be greater than 0');
  }
  if (discountType === 'percent' && value > 100) {
    throw new Error('Percent discount cannot exceed 100');
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .insert([
      {
        event_id: eventId,
        organizer_id: organizerId,
        code: clean,
        discount_type: discountType,
        discount_value: value,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('That code already exists for this event');
    }
    throw error;
  }

  return data;
}

/**
 * List all promo codes for an event.
 */
export async function getPromoCodesForEvent(eventId) {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a promo code.
 */
export async function deletePromoCode(codeId) {
  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', codeId);

  if (error) throw error;
}

/**
 * Validate a code for an event.
 * Returns:
 *   { valid: true, code: {...}, discount: number, reason: '' }
 *   { valid: false, reason: 'error message' }
 */
export async function validatePromoCode(eventId, rawCode, subtotal) {
  const clean = String(rawCode || '').toUpperCase().trim().replace(/\s+/g, '');
  if (!clean) {
    return { valid: false, reason: 'Enter a code' };
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('event_id', eventId)
    .eq('code', clean)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { valid: false, reason: 'Invalid code' };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'This code has expired' };
  }

  if (
    data.max_uses !== null &&
    data.times_used >= data.max_uses
  ) {
    return { valid: false, reason: 'This code has reached its limit' };
  }

  // Calculate discount
  const sub = Number(subtotal) || 0;
  let discount = 0;

  if (data.discount_type === 'percent') {
    discount = Math.round((sub * Number(data.discount_value)) / 100);
  } else {
    discount = Math.min(Number(data.discount_value), sub);
  }

  if (discount <= 0) {
    return { valid: false, reason: 'This code has no value' };
  }

  if (discount > sub) discount = sub;

  return {
    valid: true,
    code: data,
    discount,
    reason: '',
  };
}

/**
 * Increment times_used for a promo code.
 * Called after successful payment.
 */
export async function incrementPromoCodeUsage(codeId) {
  const { data: code, error: fetchError } = await supabase
    .from('promo_codes')
    .select('times_used')
    .eq('id', codeId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('promo_codes')
    .update({ times_used: (code.times_used || 0) + 1 })
    .eq('id', codeId);

  if (error) throw error;
    }
