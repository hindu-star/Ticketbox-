import { supabase } from './supabase';

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updatePersonalInfo(userId, info) {
  const payload = {
    first_name: info.first_name || '',
    middle_name: info.middle_name || '',
    last_name: info.last_name || '',
    phone: info.phone || '',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateOrganizerInfo(userId, info) {
  const payload = {
    username: info.username ? info.username.toLowerCase().trim() : null,
    display_name: info.display_name || '',
    about: info.about || '',
    profile_picture_url: info.profile_picture_url || null,
    website_url: info.website_url || null,
    instagram_url: info.instagram_url || null,
    twitter_url: info.twitter_url || null,
    facebook_url: info.facebook_url || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

export async function updatePayoutAccount(userId, payout) {
  const payload = {
    bank_code: payout.bank_code || null,
    bank_name: payout.bank_name || null,
    account_number: payout.account_number || null,
    account_name: payout.account_name || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

export async function saveSubaccountCode(userId, subaccountCode) {
  const { error } = await supabase
    .from('profiles')
    .update({
      paystack_subaccount_code: subaccountCode,
      payout_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function isUsernameTaken(username, currentUserId) {
  const clean = username.toLowerCase().trim();
  if (!clean) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', clean)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  return data.id !== currentUserId;
}

/**
 * Read the current name from the user's profile row.
 * Falls back to signup metadata if the profile row is missing.
 */
export async function getCurrentName() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, middle_name, last_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return {
      first_name: profile.first_name || '',
      middle_name: profile.middle_name || '',
      last_name: profile.last_name || '',
    };
  }

  const meta = user.user_metadata || {};
  return {
    first_name: meta.first_name || '',
    middle_name: meta.middle_name || '',
    last_name: meta.last_name || '',
  };
}

/**
 * Compare a bank account name against the user's current name.
 * BIDIRECTIONAL check:
 *   - Every profile token must appear in the bank name
 *   - Every bank token must appear in the profile name
 * Prevents subset matches (e.g. profile "Hindu Nene Nene" vs bank "Akim Hindu Nene").
 * Returns { match: boolean, reason: string }.
 */
export function namesMatch(bankAccountName, currentName) {
  if (!bankAccountName) {
    return { match: false, reason: 'No bank account name to check.' };
  }
  if (!currentName) {
    return { match: false, reason: 'No profile name on file.' };
  }

  // Tokens from the user's profile name
  const profileTokens = [
    currentName.first_name,
    currentName.middle_name,
    currentName.last_name,
  ]
    .filter(Boolean)
    .flatMap((n) => n.toLowerCase().split(/\s+/))
    .filter((t) => t.length > 1);

  // Tokens from the bank account name
  const bankTokens = bankAccountName
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (profileTokens.length === 0) {
    return { match: false, reason: 'Profile name is empty.' };
  }
  if (bankTokens.length === 0) {
    return { match: false, reason: 'Bank account name is empty.' };
  }

  const bankLower = bankAccountName.toLowerCase();

  // Every profile token must appear in the bank name
  const missingFromBank = profileTokens.filter((t) => !bankLower.includes(t));

  // Every bank token must appear in the profile name
  const profileLower = [
    currentName.first_name,
    currentName.middle_name,
    currentName.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const missingFromProfile = bankTokens.filter(
    (t) => !profileLower.includes(t)
  );

  if (missingFromBank.length === 0 && missingFromProfile.length === 0) {
    return { match: true, reason: 'Names match.' };
  }

  const problems = [];

  if (missingFromBank.length > 0) {
    problems.push(`profile has extra: ${missingFromBank.join(', ')}`);
  }
  if (missingFromProfile.length > 0) {
    problems.push(`bank has extra: ${missingFromProfile.join(', ')}`);
  }

  return {
    match: false,
    reason: `Your bank account name doesn't match your profile name (${problems.join('; ')})`,
  };
}
