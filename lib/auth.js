import { supabase } from './supabase';

export async function signUp(email, password, firstName, lastName, middleName) {
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName || '',
        middle_name: middleName || '',
        last_name: lastName || '',
        full_name: fullName || '',
      },
    },
  });

  if (error) throw error;

  // Fire welcome email (fire-and-forget)
  try {
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: firstName || email.split('@')[0],
      }),
    }).catch((err) => {
      console.error('Welcome email fetch failed:', err);
    });
  } catch (err) {
    console.error('Welcome email error:', err);
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
