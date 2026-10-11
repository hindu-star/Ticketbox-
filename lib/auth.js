import { supabase } from './supabase';
import { sendWelcomeEmail } from './email';

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Fire-and-forget welcome email
  try {
    await sendWelcomeEmail({ to: email, name: name || email.split('@')[0] });
  } catch (e) {
    console.error('Welcome email failed:', e);
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
